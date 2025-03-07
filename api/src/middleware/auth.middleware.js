// server/middleware/auth.middleware.js
import passport from 'passport';
import logger from '../utils/logger.js';

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur est authentifié via JWT (bearer token ou cookie)
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const authMiddleware = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Erreur d\'authentification:', err);
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info && info.message ? info.message : 'Non authentifié'
      });
    }
    
    // Vérifier si le compte est actif
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }
    
    // Attacher l'utilisateur à la requête
    req.user = user;
    
    // Mettre à jour la date de dernière activité
    user.lastActive = new Date();
    user.save().catch(error => {
      logger.error('Erreur lors de la mise à jour de la dernière activité:', error);
    });
    
    next();
  })(req, res, next);
};

/**
 * Middleware d'authentification optionnelle
 * Si un token est présent, authentifie l'utilisateur, mais n'échoue pas si aucun token n'est fourni
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
export const optionalAuthMiddleware = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Erreur d\'authentification optionnelle:', err);
      return next(err);
    }
    
    if (user && user.active) {
      // Attacher l'utilisateur à la requête
      req.user = user;
      
      // Mettre à jour la date de dernière activité
      user.lastActive = new Date();
      user.save().catch(error => {
        logger.error('Erreur lors de la mise à jour de la dernière activité:', error);
      });
    }
    
    next();
  })(req, res, next);
};

/**
 * Middleware pour les routes de partage
 * Vérifie l'accès en fonction du token de partage ou de l'authentification
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
export const shareAuthMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token de partage
    const shareToken = req.query.token || req.cookies['share_token'];
    
    if (!shareToken) {
      // Si aucun token de partage n'est fourni, vérifier l'authentification normale
      return authMiddleware(req, res, next);
    }
    
    // Importer le modèle MediaAccess
    const MediaAccess = req.app.get('models').MediaAccess;
    
    // Vérifier le token de partage
    const share = await MediaAccess.findOne({
      shareKey: shareToken,
      active: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!share) {
      return res.status(403).json({
        success: false,
        message: 'Lien de partage invalide ou expiré'
      });
    }
    
    // Vérifier si un mot de passe est requis
    if (share.shareConfig && share.shareConfig.password && !req.cookies['share_auth']) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe requis',
        requirePassword: true
      });
    }
    
    // Vérifier si un compte est requis
    if (share.shareConfig && share.shareConfig.requireAccount && !req.user) {
      return authMiddleware(req, res, next);
    }
    
    // Vérifier le nombre maximal d'accès
    if (share.shareConfig && 
        share.shareConfig.maxAccesses > 0 && 
        share.shareConfig.accessCount >= share.shareConfig.maxAccesses) {
      return res.status(403).json({
        success: false,
        message: 'Nombre maximal d\'accès atteint'
      });
    }
    
    // Incrémenter le compteur d'accès
    if (share.shareConfig) {
      share.shareConfig.accessCount = (share.shareConfig.accessCount || 0) + 1;
      await share.save();
    }
    
    // Attacher les informations de partage à la requête
    req.shareInfo = {
      path: share.path,
      permissions: share.permissions,
      shareKey: share.shareKey
    };
    
    next();
  } catch (error) {
    logger.error('Erreur lors de la vérification du partage:', error);
    next(error);
  }
};

export default authMiddleware;