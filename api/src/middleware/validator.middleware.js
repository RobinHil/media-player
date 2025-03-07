// server/middleware/validator.middleware.js
import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Middleware pour valider les entrées utilisateur avec express-validator
 * Vérifie les résultats de validation et renvoie les erreurs si nécessaire
 * 
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
const validatorMiddleware = (req, res, next) => {
  // Obtenir les résultats de validation
  const errors = validationResult(req);
  
  // Si aucune erreur n'est trouvée, continuer
  if (errors.isEmpty()) {
    return next();
  }
  
  // Formater les erreurs
  const formattedErrors = errors.array().map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
  
  // Journaliser les erreurs de validation
  logger.debug('Erreurs de validation:', JSON.stringify(formattedErrors));
  
  // Renvoyer les erreurs au client
  return res.status(400).json({
    success: false,
    message: 'Validation échouée',
    errors: formattedErrors
  });
};

/**
 * Fonction factory pour créer un middleware de validation personnalisé
 * pour la validation des schémas JSON avec Joi
 * 
 * @param {Object} schema - Schéma Joi
 * @param {String} property - Propriété à valider (body, query, params)
 * @returns {Function} Middleware Express
 */
export const validateWithJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false
    });
    
    if (!error) {
      return next();
    }
    
    // Formater les erreurs
    const formattedErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    // Journaliser les erreurs de validation
    logger.debug('Erreurs de validation Joi:', JSON.stringify(formattedErrors));
    
    // Renvoyer les erreurs au client
    return res.status(400).json({
      success: false,
      message: 'Validation échouée',
      errors: formattedErrors
    });
  };
};

/**
 * Middleware pour valider les formats de fichiers téléchargés
 * 
 * @param {Array<String>} allowedTypes - Types MIME autorisés
 * @param {Number} maxSize - Taille maximale en octets
 * @returns {Function} Middleware Express
 */
export const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    // Vérifier si un fichier a été téléchargé
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier téléchargé'
      });
    }
    
    // Gérer un ou plusieurs fichiers
    const files = req.files || [req.file];
    
    // Vérifier chaque fichier
    for (const file of files) {
      // Vérifier le type MIME
      if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Type de fichier non autorisé: ${file.mimetype}`,
          allowedTypes
        });
      }
      
      // Vérifier la taille
      if (maxSize && file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Fichier trop volumineux: ${file.size} octets`,
          maxSize
        });
      }
    }
    
    next();
  };
};

export default validatorMiddleware;