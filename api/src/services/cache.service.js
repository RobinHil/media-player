// server/services/cache.service.js
import { createClient } from 'redis';
import config from '../config/config.js';
import logger from '../utils/logger.js';

// Classe pour l'implémentation du cache en mémoire
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async get(key) {
    return this.cache.get(key);
  }

  async set(key, value, ttl = 0) {
    // Supprimer l'ancien timer s'il existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    // Stocker la valeur
    this.cache.set(key, value);

    // Configurer l'expiration si nécessaire
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);

      this.timers.set(key, timer);
    }

    return true;
  }

  async del(key) {
    // Supprimer le timer s'il existe
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    // Supprimer la valeur
    return this.cache.delete(key);
  }

  async clear() {
    // Nettoyer tous les timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.cache.clear();
    return true;
  }
}

// Classe pour le client Redis
class RedisCache {
  constructor(redisUrl) {
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (error) => {
      logger.error('Erreur de connexion Redis:', error);
    });

    this.client.on('connect', () => {
      logger.info('Connexion Redis établie');
    });

    this.client.connect().catch((error) => {
      logger.error('Échec de la connexion Redis:', error);
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value === null) return undefined;
      
      // Tenter de parser JSON, renvoyer la chaîne brute si ce n'est pas du JSON
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la clé ${key}:`, error);
      return undefined;
    }
  }

  async set(key, value, ttl = 0) {
    try {
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (ttl > 0) {
        await this.client.setEx(key, ttl, valueToStore);
      } else {
        await this.client.set(key, valueToStore);
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors du stockage de la clé ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la clé ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Erreur lors du nettoyage du cache:', error);
      return false;
    }
  }
}

// Créer l'instance de cache appropriée
let cacheInstance;

if (config.cache.enabled) {
  if (config.cache.redisUrl) {
    try {
      cacheInstance = new RedisCache(config.cache.redisUrl);
      logger.info('Cache Redis initialisé');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du cache Redis:', error);
      cacheInstance = new MemoryCache();
      logger.info('Fallback vers le cache en mémoire');
    }
  } else {
    cacheInstance = new MemoryCache();
    logger.info('Cache en mémoire initialisé');
  }
} else {
  // Cache désactivé, utiliser une implémentation vide
  cacheInstance = {
    get: async () => undefined,
    set: async () => true,
    del: async () => true,
    clear: async () => true
  };
  logger.info('Cache désactivé');
}

export default cacheInstance;