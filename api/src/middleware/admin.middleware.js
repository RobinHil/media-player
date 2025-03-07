// server/middleware/admin.middleware.js
import logger from '../utils/logger.js';

/**
 * Middleware pour vérifier les privilèges administrateur
 * Doit être utilisé après le middleware d'authentification
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const adminMiddleware = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier que l'utilisateur a le rôle admin
  if (req.user.role !== 'admin') {
    logger.warn(`Tentative d'accès administrateur non autorisée par l'utilisateur ${req.user._id}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges administrateur requis.'
    });
  }

  next();
};

/**
 * Middleware pour vérifier les privilèges d'éditeur ou administrateur
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
export const editorMiddleware = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier que l'utilisateur a le rôle admin ou editor
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    logger.warn(`Tentative d'accès éditeur non autorisée par l'utilisateur ${req.user._id}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges d\'éditeur requis.'
    });
  }

  next();
};

/**
 * Middleware pour vérifier les permissions spécifiques
 * 
 * @param {Array<String>} permissions - Tableau des permissions requises
 * @returns {Function} Middleware Express
 */
export const requirePermissions = (permissions) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Les administrateurs ont toutes les permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si l'utilisateur a toutes les permissions requises
    const hasAllPermissions = permissions.every(permission => {
      // Implémenter votre logique de vérification des permissions ici
      // Par exemple, vérifier dans un champ permissions de l'utilisateur
      return req.user.permissions && req.user.permissions.includes(permission);
    });

    if (!hasAllPermissions) {
      logger.warn(`Permissions insuffisantes pour l'utilisateur ${req.user._id}`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Permissions insuffisantes.'
      });
    }

    next();
  };
};

export default adminMiddleware;