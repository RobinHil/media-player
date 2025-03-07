// server/middleware/error.middleware.js
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Middleware de gestion des erreurs
 * Centralise la gestion des erreurs pour une réponse cohérente
 * 
 * @param {Error} err - L'erreur survenue
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next (non utilisée car c'est le dernier middleware)
 */
const errorMiddleware = (err, req, res, next) => {
  // Journaliser l'erreur
  logger.error('Erreur non gérée:', err);
  
  // Déterminer le code d'état HTTP
  let statusCode = 500;
  
  // Traitement spécial pour certains types d'erreurs
  if (err.name === 'ValidationError') {
    // Erreur de validation Mongoose
    statusCode = 400;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // Erreur JWT
    statusCode = 401;
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // Erreur de clé dupliquée MongoDB
    statusCode = 409;
  } else if (err.statusCode) {
    // Utiliser le code d'état fourni par l'erreur si disponible
    statusCode = err.statusCode;
  }
  
  // Construire la réponse d'erreur
  const errorResponse = {
    success: false,
    message: err.message || 'Erreur interne du serveur',
    status: statusCode,
    error: err.name || 'InternalServerError'
  };
  
  // Ajouter les détails supplémentaires si disponibles
  if (err.errors) {
    errorResponse.errors = err.errors;
  }
  
  // En mode développement, inclure la stack trace
  if (config.server.env === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // Envoyer la réponse d'erreur
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware pour capturer les erreurs 404 (Not Found)
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
export const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`Ressource non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  error.name = 'NotFoundError';
  
  next(error);
};

/**
 * Fonction utilitaire pour créer des erreurs avec un code d'état HTTP
 * 
 * @param {String} message - Message d'erreur
 * @param {Number} statusCode - Code d'état HTTP
 * @param {String} name - Nom de l'erreur
 * @returns {Error} Erreur personnalisée
 */
export const createHttpError = (message, statusCode = 500, name = 'HttpError') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  
  return error;
};

export default errorMiddleware;