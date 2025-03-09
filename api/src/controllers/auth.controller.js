// server/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import config from '../config/config.js';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import logger from '../utils/logger.js';
import { createHttpError } from '../middleware/error.middleware.js';

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      });
    }
    
    // Vérifier si l'inscription est activée
    const settings = await getSystemSettings();
    if (settings.registration && settings.registration.enabled === false) {
      return res.status(403).json({
        success: false,
        message: 'L\'inscription de nouveaux utilisateurs est désactivée'
      });
    }
    
    // Créer un nouvel utilisateur
    const user = new User({
      email,
      password,
      name,
      active: settings.registration && settings.registration.requireApproval ? false : true
    });
    
    // Sauvegarder l'utilisateur
    await user.save();
    
    // Journaliser l'action
    logger.info(`Nouvel utilisateur inscrit: ${email}`);
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'register',
      userId: user._id,
      details: {
        name: user.name,
        email: user.email
      },
      ip: req.ip
    });
    
    // Retourner l'utilisateur créé (sans le mot de passe)
    const userObject = user.toSafeObject();
    
    res.status(201).json({
      success: true,
      message: settings.registration && settings.registration.requireApproval ? 
        'Inscription réussie. Votre compte doit être approuvé par un administrateur.' : 
        'Inscription réussie',
      user: userObject
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    
    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier si le compte est actif
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé'
      });
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();
    
    // Générer les tokens
    const { accessToken, refreshToken, expiresIn } = await generateTokens(user, req, rememberMe);
    
    // Journaliser la connexion
    logger.info(`Utilisateur connecté: ${email}`);
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'login',
      userId: user._id,
      details: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      },
      ip: req.ip
    });
    
    // Préparer la réponse avec les tokens
    const response = {
      success: true,
      token: accessToken,
      refreshToken,
      expiresIn,
      user: user.toSafeObject()
    };
    
    // Définir le cookie d'accès
    const cookieOptions = {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 jours ou 1 jour
    };
    
    res.cookie('access_token', accessToken, cookieOptions);
    
    // Renvoyer la réponse
    res.status(200).json(response);
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    next(error);
  }
};

/**
 * Déconnexion d'un utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const logout = async (req, res, next) => {
  try {
    // Récupérer le token de rafraîchissement
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
      // Invalider la session
      await Session.findOneAndUpdate(
        { refreshToken },
        { active: false },
        { new: true }
      );
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: 'logout',
        userId: req.user._id,
        details: {
          sessionId: refreshToken
        },
        ip: req.ip
      });
    }
    
    // Nettoyer le cookie
    res.clearCookie('access_token');
    
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error);
    next(error);
  }
};

/**
 * Rafraîchir le token d'accès
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement requis'
      });
    }
    
    // Trouver la session associée au token
    const session = await Session.findOne({
      refreshToken,
      active: true,
      expiresAt: { $gt: new Date() }
    }).populate('user');
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide ou expiré'
      });
    }
    
    // Vérifier que l'utilisateur est toujours actif
    if (!session.user || !session.user.active) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }
    
    // Mettre à jour la dernière activité de la session
    session.lastActivity = new Date();
    await session.save();
    
    // Générer un nouveau token d'accès
    const payload = {
      sub: session.user._id,
      email: session.user.email,
      role: session.user.role
    };
    
    const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn
    });
    
    // Calculer l'expiration
    const expiresIn = Math.floor((new Date(session.expiresAt).getTime() - new Date().getTime()) / 1000);
    
    // Définir le cookie
    const cookieOptions = {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: 'strict',
      maxAge: expiresIn * 1000
    };
    
    res.cookie('access_token', accessToken, cookieOptions);
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'refresh_token',
      userId: session.user._id,
      details: {
        sessionId: session._id
      },
      ip: req.ip
    });
    
    // Envoyer la réponse
    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: session.refreshToken, // On renvoie le même token de rafraîchissement
      expiresIn,
      user: session.user.toSafeObject()
    });
  } catch (error) {
    logger.error('Erreur lors du rafraîchissement du token:', error);
    next(error);
  }
};

/**
 * Récupérer les informations de l'utilisateur connecté
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getMe = async (req, res, next) => {
  try {
    // L'utilisateur est déjà attaché à la requête par le middleware d'authentification
    const user = req.user;
    
    // Renvoyer les informations de l'utilisateur
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des informations utilisateur:', error);
    next(error);
  }
};

/**
 * Demander la réinitialisation du mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    
    // Si l'utilisateur n'existe pas, ne pas divulguer cette information
    if (!user) {
      // Dans un environnement de production, retourner quand même un succès pour éviter les attaques par énumération
      return res.status(200).json({
        success: true,
        message: 'Si votre email est enregistré, vous recevrez un email de réinitialisation'
      });
    }
    
    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Enregistrer le token dans la base de données
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure
    await user.save();
    
    // Dans une application réelle, envoyer un email avec le lien de réinitialisation
    // Ici, on simule simplement le processus
    
    // Construire l'URL de réinitialisation
    const resetUrl = `${config.server.corsOrigin}/reset-password/${resetToken}`;
    
    // Loguer l'URL pour le développement
    if (config.server.env === 'development') {
      logger.info(`URL de réinitialisation: ${resetUrl}`);
    }
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'forgot_password',
      userId: user._id,
      details: {
        ip: req.ip
      },
      ip: req.ip
    });
    
    // TODO: Implémenter l'envoi d'email
    
    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });
  } catch (error) {
    logger.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
    next(error);
  }
};

/**
 * Réinitialiser le mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    // Hacher le token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
    
    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Révoquer toutes les sessions existantes
    await Session.updateMany(
      { user: user._id },
      { active: false }
    );
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'reset_password',
      userId: user._id,
      details: {
        ip: req.ip
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
    next(error);
  }
};

/**
 * Callback après authentification Google
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const googleCallback = async (req, res, next) => {
  try {
    // Générer les tokens JWT
    const user = req.user;
    
    // Générer le token d'accès et le token de rafraîchissement
    const { accessToken, refreshToken } = await generateTokens(user, req);
    
    // Rediriger vers l'application frontend avec les tokens
    res.redirect(`${config.server.corsOrigin}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error) {
    logger.error('Erreur lors du callback Google:', error);
    
    // Rediriger vers la page d'erreur
    res.redirect(`${config.server.corsOrigin}/auth/error`);
  }
};

/**
 * Générer des tokens d'accès et de rafraîchissement
 * @param {Object} user - L'utilisateur
 * @param {Object} req - Objet requête Express
 * @param {Boolean} rememberMe - Conserver la session plus longtemps
 * @returns {Object} Tokens générés
 */
const generateTokens = async (user, req, rememberMe = false) => {
  // Préparer le payload pour le JWT
  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role
  };
  
  // Récupérer les paramètres de sécurité
  const settings = await getSystemSettings();
  const sessionTimeout = settings.security && settings.security.sessionTimeout ? 
    settings.security.sessionTimeout : 3600; // 1 heure par défaut
  
  // Durée de validité du token d'accès
  const tokenExpiresIn = `${sessionTimeout}s`;
  
  // Générer le token d'accès
  const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: tokenExpiresIn
  });
  
  // Générer un token de rafraîchissement
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Extraire les informations sur le client
  const userAgent = req.headers['user-agent'];
  const ip = req.ip || req.connection.remoteAddress;
  
  // Calculer la date d'expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 jours ou 7 jours
  
  // Créer une nouvelle session
  const session = new Session({
    user: user._id,
    refreshToken,
    userAgent,
    ip,
    expiresAt,
    device: extractDevice(userAgent),
    browser: extractBrowser(userAgent),
    os: extractOS(userAgent)
  });
  
  await session.save();
  
  // Calculer l'expiration en secondes
  const expiresIn = sessionTimeout;
  
  return { accessToken, refreshToken, expiresIn };
};

/**
 * Récupérer les paramètres système
 * @returns {Object} Paramètres système
 */
const getSystemSettings = async () => {
  try {
    // Importer le modèle des paramètres
    const Setting = await import('../models/setting.model.js').then(m => m.default);
    
    // Récupérer les paramètres
    const settings = await Setting.findOne({});
    
    if (!settings) {
      // Créer les paramètres par défaut
      const defaultSettings = new Setting({
        registration: {
          enabled: true,
          requireApproval: false
        },
        storage: {
          defaultLimit: 5 * 1024 * 1024 * 1024 // 5GB par défaut
        },
        security: {
          maxLoginAttempts: 5,
          lockoutTime: 300, // 5 minutes
          sessionTimeout: 3600 // 1 heure
        }
      });
      
      await defaultSettings.save();
      return defaultSettings;
    }
    
    return settings;
  } catch (error) {
    logger.error('Erreur lors de la récupération des paramètres système:', error);
    
    // Retourner des paramètres par défaut en cas d'erreur
    return {
      registration: {
        enabled: true,
        requireApproval: false
      },
      storage: {
        defaultLimit: 5 * 1024 * 1024 * 1024 // 5GB par défaut
      },
      security: {
        maxLoginAttempts: 5,
        lockoutTime: 300, // 5 minutes
        sessionTimeout: 3600 // 1 heure
      }
    };
  }
};

/**
 * Créer une entrée dans le journal d'activité
 * @param {Object} data - Données de l'activité
 * @returns {Promise} Promise résolue avec l'entrée créée
 */
const createActivityLog = async (data) => {
  try {
    // Importer le modèle du journal d'activité
    const ActivityLog = await import('../models/activityLog.model.js').then(m => m.default);
    
    // Créer une nouvelle entrée
    const log = new ActivityLog(data);
    
    // Sauvegarder l'entrée
    await log.save();
    
    return log;
  } catch (error) {
    logger.error('Erreur lors de la création d\'une entrée dans le journal d\'activité:', error);
    return null;
  }
};

// Fonctions utilitaires pour extraire les informations du user-agent
const extractDevice = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  if (/ipad/i.test(userAgent)) return 'Tablet';
  
  return 'Desktop';
};

const extractBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
  
  return 'Unknown';
};

const extractOS = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  
  return 'Unknown';
};

export default {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  googleCallback
};