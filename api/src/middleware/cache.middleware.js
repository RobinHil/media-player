// server/middleware/cache.middleware.js
import crypto from 'crypto';
import cacheService from '../services/cache.service.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Middleware pour la mise en cache des réponses
 * 
 * @param {Number} ttl - Durée de vie du cache en secondes
 * @param {Function} keyGenerator - Fonction personnalisée pour générer la clé de cache
 * @returns {Function} Middleware Express
 */
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  // Si le cache est désactivé, retourner un middleware passthrough
  if (!config.cache.enabled) {
    return (req, res, next) => next();
  }
  
  return async (req, res, next) => {
    try {
      // Générer une clé de cache unique
      let cacheKey;
      
      if (keyGenerator && typeof keyGenerator === 'function') {
        // Utiliser le générateur de clé personnalisé
        cacheKey = keyGenerator(req);
      } else {
        // Générer une clé basée sur la méthode HTTP, l'URL et l'utilisateur
        const userId = req.user ? req.user._id.toString() : 'anonymous';
        const data = `${req.method}:${req.originalUrl}:${userId}`;
        cacheKey = crypto.createHash('md5').update(data).digest('hex');
      }
      
      // Préfixer la clé pour éviter les conflits
      cacheKey = `cache:${cacheKey}`;
      
      // Vérifier si la réponse est en cache
      const cachedResponse = await cacheService.get(cacheKey);
      
      // Si une réponse en cache est trouvée, la renvoyer
      if (cachedResponse) {
        logger.debug(`Cache hit pour ${cacheKey}`);
        
        // Restaurer les en-têtes
        if (cachedResponse.headers) {
          for (const [key, value] of Object.entries(cachedResponse.headers)) {
            res.setHeader(key, value);
          }
        }
        
        // Définir l'en-tête pour indiquer que la réponse provient du cache
        res.setHeader('X-Cache', 'HIT');
        
        // Renvoyer la réponse en cache
        return res.status(cachedResponse.status).send(cachedResponse.data);
      }
      
      logger.debug(`Cache miss pour ${cacheKey}`);
      
      // Intercepter la méthode send pour mettre en cache la réponse
      const originalSend = res.send;
      res.send = function(body) {
        // Stocker la réponse en cache seulement si c'est un succès
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Capture des en-têtes importants
          const headers = {};
          const headersToCache = ['content-type', 'content-language', 'content-encoding'];
          
          for (const header of headersToCache) {
            if (res.getHeader(header)) {
              headers[header] = res.getHeader(header);
            }
          }
          
          // Stocker la réponse en cache
          const responseToCache = {
            data: body,
            status: res.statusCode,
            headers
          };
          
          cacheService.set(cacheKey, responseToCache, ttl).catch(error => {
            logger.error(`Erreur lors de la mise en cache pour ${cacheKey}:`, error);
          });
        }
        
        // Définir l'en-tête pour indiquer que la réponse est fraîche
        res.setHeader('X-Cache', 'MISS');
        
        // Appeler la méthode send originale
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Erreur dans le middleware de cache:', error);
      next();
    }
  };
};

/**
 * Middleware pour invalider le cache
 * Utilisé pour les opérations qui modifient les données
 * 
 * @param {Array<String>} patterns - Modèles de clés à invalider
 * @returns {Function} Middleware Express
 */
export const invalidateCache = (patterns = []) => {
  // Si le cache est désactivé, retourner un middleware passthrough
  if (!config.cache.enabled) {
    return (req, res, next) => next();
  }
  
  return async (req, res, next) => {
    // Sauvegarder la méthode end originale
    const originalEnd = res.end;
    
    // Remplacer la méthode end pour invalider le cache après une réponse réussie
    res.end = async function(...args) {
      // Si la réponse est un succès, invalider le cache
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // TODO: Implémenter l'invalidation basée sur des modèles
          // Pour l'instant, utiliser une logique simplifiée
          
          // Extraction des informations pertinentes de la requête
          const userId = req.user ? req.user._id.toString() : 'anonymous';
          const path = req.path.split('/').filter(Boolean);
          
          // Générer des clés à invalider en fonction des modèles et du contexte
          for (const pattern of patterns) {
            // Exemple: si le modèle est 'files', invalider toutes les clés qui contiennent '/files/'
            if (pattern === 'files' && path.includes('files')) {
              // Logique spécifique pour les fichiers
              // Ici, on pourrait implémenter une logique plus sophistiquée
              logger.debug(`Invalidation du cache pour le modèle '${pattern}'`);
            }
          }
          
          // Pour l'instant, journaliser simplement l'invalidation
          logger.debug(`Cache invalidé pour les modèles: ${patterns.join(', ')}`);
        } catch (error) {
          logger.error('Erreur lors de l\'invalidation du cache:', error);
        }
      }
      
      // Appeler la méthode end originale
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

export default cacheMiddleware;