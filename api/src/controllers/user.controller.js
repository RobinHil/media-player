// server/controllers/user.controller.js
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import ActivityLog from '../models/activityLog.model.js';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import config from '../config/config.js';

/**
 * Récupérer le profil de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getProfile = async (req, res, next) => {
  try {
    // L'utilisateur est déjà attaché à la requête par le middleware d'authentification
    const user = req.user;
    
    res.status(200).json({
      success: true,
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil utilisateur:', error);
    next(error);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = req.user;

    // Mettre à jour le nom si fourni
    if (name) {
      user.name = name;
    }

    await user.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'update_profile',
      userId: user._id,
      details: {
        name
      },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour',
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du profil:', error);
    next(error);
  }
};

/**
 * Changer le mot de passe de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password');

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    // Révoquer toutes les sessions existantes sauf la session courante
    const currentSession = req.cookies['refresh_token'] || 
                          (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
                          req.headers.authorization.split(' ')[1] : null);
    
    await Session.updateMany(
      { 
        user: user._id,
        refreshToken: { $ne: currentSession }
      },
      { active: false }
    );
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'change_password',
      userId: user._id,
      details: {
        ip: req.ip
      },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors du changement de mot de passe:', error);
    next(error);
  }
};

/**
 * Récupérer les préférences utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getPreferences = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      preferences: user.preferences || {}
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des préférences:', error);
    next(error);
  }
};

/**
 * Mettre à jour les préférences utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Mettre à jour les préférences
    user.preferences = {
      ...user.preferences,
      ...req.body
    };
    
    await user.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'update_preferences',
      userId: user._id,
      details: {
        preferences: req.body
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Préférences mises à jour',
      preferences: user.preferences
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des préférences:', error);
    next(error);
  }
};

/**
 * Récupérer les sessions actives de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSessions = async (req, res, next) => {
  try {
    // Récupérer le refresh token actuel de la session
    const currentRefreshToken = req.cookies['refresh_token'] || 
                              (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
                              req.headers.authorization.split(' ')[1] : null);
    
    // Récupérer toutes les sessions actives de l'utilisateur
    const sessions = await Session.find({
      user: req.user._id,
      active: true,
      expiresAt: { $gt: new Date() }
    }).select('-refreshToken');
    
    // Marquer la session courante
    const sessionsWithCurrent = sessions.map(session => ({
      ...session.toObject(),
      current: session.refreshToken === currentRefreshToken
    }));
    
    res.status(200).json({
      success: true,
      sessions: sessionsWithCurrent
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des sessions:', error);
    next(error);
  }
};

/**
 * Révoquer une session spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la session existe et appartient à l'utilisateur
    const session = await Session.findOne({
      _id: id,
      user: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }
    
    // Révoquer la session
    session.active = false;
    await session.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'revoke_session',
      userId: req.user._id,
      details: {
        sessionId: id,
        device: session.device,
        browser: session.browser
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Session révoquée avec succès'
    });
  } catch (error) {
    logger.error('Erreur lors de la révocation de la session:', error);
    next(error);
  }
};

/**
 * Révoquer toutes les sessions sauf la session courante
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const revokeAllSessions = async (req, res, next) => {
  try {
    // Récupérer le refresh token actuel
    const currentRefreshToken = req.cookies['refresh_token'] || 
                              (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
                              req.headers.authorization.split(' ')[1] : null);
    
    // Révoquer toutes les autres sessions
    const result = await Session.updateMany(
      {
        user: req.user._id,
        active: true,
        refreshToken: { $ne: currentRefreshToken }
      },
      {
        active: false
      }
    );
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'revoke_all_sessions',
      userId: req.user._id,
      details: {
        count: result.nModified,
        ip: req.ip
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Toutes les autres sessions ont été révoquées avec succès',
      count: result.nModified
    });
  } catch (error) {
    logger.error('Erreur lors de la révocation des sessions:', error);
    next(error);
  }
};

/**
 * Récupérer tous les utilisateurs (admin seulement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getAllUsers = async (req, res, next) => {
  try {
    // Récupérer tous les utilisateurs
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs:', error);
    next(error);
  }
};

/**
 * Récupérer un utilisateur par ID (admin seulement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'utilisateur
    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Calculer l'utilisation du stockage
    let storageUsed = 0;
    
    try {
      const userDir = path.join(config.media.baseDir, user._id.toString());
      // Vérifier si le dossier de l'utilisateur existe
      try {
        await fs.access(userDir);
        
        // Calculer l'espace utilisé
        const { totalSize } = await calculateStorageUsage(userDir);
        storageUsed = totalSize;
      } catch (error) {
        // Le dossier n'existe pas, donc l'utilisation est de 0
      }
    } catch (error) {
      logger.error(`Erreur lors du calcul de l'espace utilisé pour l'utilisateur ${id}:`, error);
    }
    
    // Ajouter l'information de stockage
    const userWithStorage = {
      ...user.toObject(),
      storage: {
        used: storageUsed,
        limit: user.storageLimit || config.storage.defaultLimit
      }
    };
    
    res.status(200).json({
      success: true,
      user: userWithStorage
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Mettre à jour un utilisateur (admin seulement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, active, storageLimit } = req.body;
    
    // Récupérer l'utilisateur
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Mettre à jour les champs
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;
    if (storageLimit) user.storageLimit = storageLimit;
    
    await user.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'admin_update_user',
      userId: req.user._id,
      details: {
        targetUserId: id,
        updates: { name, email, role, active, storageLimit }
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour',
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Supprimer un utilisateur (admin seulement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteData = req.query.deleteData === 'true';
    
    // Vérifier que l'utilisateur n'essaie pas de se supprimer lui-même
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Supprimer le dossier de l'utilisateur si demandé
    if (deleteData) {
      try {
        const userDir = path.join(config.media.baseDir, user._id.toString());
        
        // Vérifier si le dossier existe
        try {
          await fs.access(userDir);
          
          // Supprimer récursivement le dossier
          await deleteDirectory(userDir);
        } catch (error) {
          // Le dossier n'existe pas, rien à faire
        }
      } catch (error) {
        logger.error(`Erreur lors de la suppression des données de l'utilisateur ${id}:`, error);
      }
    }
    
    // Supprimer les sessions de l'utilisateur
    await Session.deleteMany({ user: id });
    
    // Supprimer les entrées du journal d'activité
    await ActivityLog.deleteMany({ userId: id });
    
    // Supprimer les favoris, collections, etc.
    await Favorite.deleteMany({ user: id });
    await Folder.deleteMany({ owner: id });
    
    // Supprimer l'utilisateur
    await User.deleteOne({ _id: id });
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'admin_delete_user',
      userId: req.user._id,
      details: {
        targetUserId: id,
        deleteData,
        userName: user.name,
        userEmail: user.email
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: `Utilisateur supprimé${deleteData ? ' avec ses données' : ''}`
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'utilisateur:', error);
    next(error);
  }
};

/**
 * Calculer l'utilisation de stockage d'un dossier de manière récursive
 * @param {string} dir - Chemin du dossier à analyser
 * @returns {Object} Informations sur l'utilisation de stockage
 */
const calculateStorageUsage = async (dir) => {
  let totalSize = 0;
  let fileCount = 0;
  
  // Fonction récursive pour parcourir les dossiers
  const processDirectory = async (currentDir) => {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        // Récursion pour les sous-dossiers
        await processDirectory(itemPath);
      } else if (item.isFile()) {
        // Ajouter la taille du fichier
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
        fileCount++;
      }
    }
  };
  
  // Lancer le calcul
  await processDirectory(dir);
  
  return { totalSize, fileCount };
};

/**
 * Supprimer un dossier et son contenu de manière récursive
 * @param {string} dir - Chemin du dossier à supprimer
 */
const deleteDirectory = async (dir) => {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Supprimer récursivement le sous-dossier
      await deleteDirectory(itemPath);
    } else {
      // Supprimer le fichier
      await fs.unlink(itemPath);
    }
  }
  
  // Supprimer le dossier lui-même
  await fs.rmdir(dir);
};

/**
 * Créer une entrée dans le journal d'activité
 * @param {Object} data - Données de l'activité
 * @returns {Promise} Promise résolue avec l'entrée créée
 */
const createActivityLog = async (data) => {
  try {
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

export default {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};