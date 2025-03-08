// server/middleware/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Configuration de base du limiteur de taux de requêtes
 */
const defaultOptions = {
  windowMs: config.security.rateLimit.windowMs, // Fenêtre de temps
  max: config.security.rateLimit.max, // Nombre maximum de requêtes par fenêtre
  standardHeaders: true, // Renvoyer les en-têtes standard rate limit (RateLimit-*)
  legacyHeaders: false, // Désactiver les anciens en-têtes X-RateLimit-*
  handler: (req, res, next, options) => {
    // Journaliser la tentative de dépassement de limite
    logger.warn(`Rate limit atteint pour ${req.ip} sur ${req.originalUrl}`);
    
    // Répondre avec un message d'erreur
    res.status(options.statusCode).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      retryAfter: Math.ceil(options.windowMs / 1000) // En secondes
    });
  },
  // Fonction pour générer des clés personnalisées (basées sur l'IP et l'utilisateur)
  keyGenerator: (req) => {
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    return `${req.ip}:${userId}`;
  },
  // Ignorer certaines routes ou certains utilisateurs
  skip: (req) => {
    // Ne pas limiter les utilisateurs administrateurs
    if (req.user && req.user.role === 'admin') {
      return true;
    }
    
    // Ne pas limiter certaines routes
    if (req.path.startsWith('/api-docs') || req.path === '/health') {
      return true;
    }
    
    return false;
  }
};

/**
 * Limiteur de taux global pour toutes les routes - Valeur très élevée
 */
const globalLimiter = rateLimit({
  ...defaultOptions,
  max: 5000, // 5000 requêtes par période - Valeur volontairement élevée
  windowMs: 15 * 60 * 1000 // 15 minutes
});

/**
 * Limiteur de taux plus strict pour les routes sensibles comme l'authentification
 * Mais toujours assez élevé pour ne pas gêner l'usage normal
 */
export const authLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 tentatives maximum - Augmenté de 10 à 100
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
});

/**
 * Limiteur de taux pour les requêtes d'API - Valeur augmentée
 */
export const apiLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000 // 1000 requêtes maximum - Augmenté de 100 à 1000
});

/**
 * Limiteur de taux pour le streaming de médias - Valeur considérablement augmentée
 */
export const mediaLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 2000 // 2000 requêtes maximum - Augmenté de 50 à 2000
});

/**
 * Fonction pour créer un limiteur de taux personnalisé
 * 
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
export const createRateLimiter = (options = {}) => {
  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

export default globalLimiter;