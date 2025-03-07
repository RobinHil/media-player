// server/utils/security.js
import path from 'path';
import config from '../config/config.js';
import MediaAccess from '../models/mediaAccess.model.js';
import logger from './logger.js';

/**
 * Valide un chemin de fichier ou de dossier pour éviter les attaques de traversée de répertoire
 * @param {string} inputPath - Chemin à valider
 * @returns {boolean} True si le chemin est valide
 */
export const validatePath = (inputPath) => {
  try {
    // Normaliser le chemin
    const normalizedPath = path.normalize(inputPath);
    
    // Vérifier les tentatives de traversée de répertoire
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.startsWith('\\')) {
      logger.warn(`Tentative de traversée de répertoire détectée: ${inputPath}`);
      return false;
    }
    
    // Vérifier les caractères interdits
    const forbiddenChars = /[<>:"|?*]/;
    if (forbiddenChars.test(normalizedPath)) {
      logger.warn(`Caractères interdits détectés dans le chemin: ${inputPath}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la validation du chemin: ${error.message}`);
    return false;
  }
};

/**
 * Vérifie si un utilisateur a accès à un chemin spécifique
 * @param {Object} user - Utilisateur
 * @param {string} requestPath - Chemin relatif
 * @returns {Promise<boolean>} Si l'utilisateur a accès
 */
export const checkUserAccess = async (user, requestPath) => {
  try {
    // Si l'utilisateur n'est pas fourni, aucun accès
    if (!user) {
      return false;
    }
    
    // Les administrateurs ont accès à tout
    if (user.role === 'admin') {
      return true;
    }
    
    // En mode développement, accès complet si configuré ainsi
    if (config.server.env === 'development' && config.server.devAllAccess) {
      return true;
    }
    
    // Construire un tableau de chemins à vérifier pour les permissions récursives
    // Par exemple, pour /photos/vacances/été/, vérifier aussi /photos/ et /photos/vacances/
    const pathParts = requestPath.split('/').filter(Boolean);
    const pathsToCheck = [];
    
    let currentPath = '';
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      pathsToCheck.push(currentPath);
    }
    
    // Ajouter le chemin exact s'il n'est pas déjà inclus
    if (!pathsToCheck.includes(requestPath) && requestPath !== '') {
      pathsToCheck.push(requestPath);
    }
    
    // Ajouter la racine
    if (!pathsToCheck.includes('')) {
      pathsToCheck.unshift('');
    }
    
    // Chercher les permissions pour ces chemins
    const access = await MediaAccess.findOne({
      $or: [
        // Permissions spécifiques à l'utilisateur
        {
          path: { $in: pathsToCheck },
          user: user._id,
          'permissions.read': true
        },
        // Permissions basées sur le rôle
        {
          path: { $in: pathsToCheck },
          role: user.role,
          'permissions.read': true
        }
      ]
    });
    
    // Si une permission d'accès est trouvée, l'utilisateur a accès
    if (access) {
      return true;
    }
    
    // Vérifier s'il existe des permissions spécifiques récursives
    const recursiveAccess = await MediaAccess.findOne({
      path: { $in: pathsToCheck },
      recursive: true,
      $or: [
        { user: user._id },
        { role: user.role }
      ],
      'permissions.read': true
    });
    
    if (recursiveAccess) {
      // Vérifier si le chemin demandé est un sous-chemin du chemin avec permission récursive
      const recursivePath = recursiveAccess.path;
      
      // Si le chemin demandé commence par le chemin récursif, c'est un sous-chemin
      if (requestPath.startsWith(recursivePath)) {
        return true;
      }
    }
    
    // Aucune permission trouvée
    return false;
  } catch (error) {
    logger.error(`Erreur lors de la vérification des permissions: ${error.message}`);
    return false;
  }
};

/**
 * Vérifie si un utilisateur a une permission spécifique sur un chemin
 * @param {Object} user - Utilisateur
 * @param {string} path - Chemin relatif
 * @param {string} permission - Permission à vérifier (read, write, delete, share)
 * @returns {Promise<boolean>} Si l'utilisateur a la permission
 */
export const checkPermission = async (user, path, permission) => {
  try {
    // Si l'utilisateur n'est pas fourni, aucun accès
    if (!user) {
      return false;
    }
    
    // Les administrateurs ont toutes les permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // En mode développement, toutes les permissions si configuré ainsi
    if (config.server.env === 'development' && config.server.devAllAccess) {
      return true;
    }
    
    // Chercher les permissions pour ce chemin
    const access = await MediaAccess.findOne({
      $or: [
        // Permissions spécifiques à l'utilisateur
        {
          path: path,
          user: user._id,
          [`permissions.${permission}`]: true
        },
        // Permissions basées sur le rôle
        {
          path: path,
          role: user.role,
          [`permissions.${permission}`]: true
        }
      ]
    });
    
    // Si une permission est trouvée, l'utilisateur a la permission
    if (access) {
      return true;
    }
    
    // Chercher des permissions récursives sur les dossiers parents
    const pathParts = path.split('/').filter(Boolean);
    const parentPaths = [];
    
    let currentPath = '';
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      parentPaths.push(currentPath);
    }
    
    // Retirer le chemin actuel, on ne garde que les parents
    if (parentPaths.length > 0) {
      parentPaths.pop();
    }
    
    // Ajouter la racine
    parentPaths.unshift('');
    
    // Chercher des permissions récursives
    const recursiveAccess = await MediaAccess.findOne({
      path: { $in: parentPaths },
      recursive: true,
      $or: [
        { user: user._id },
        { role: user.role }
      ],
      [`permissions.${permission}`]: true
    });
    
    return !!recursiveAccess;
  } catch (error) {
    logger.error(`Erreur lors de la vérification des permissions spécifiques: ${error.message}`);
    return false;
  }
};

/**
 * Génère un token d'accès temporaire pour un partage
 * @param {string} path - Chemin du fichier ou dossier à partager
 * @param {Object} options - Options de partage (durée, mot de passe, etc.)
 * @returns {Promise<string>} Token de partage
 */
export const generateShareToken = async (path, options = {}) => {
  try {
    const { expiresIn = '7d', requirePassword = false, maxAccesses = 0 } = options;
    
    // Générer une clé aléatoire
    const crypto = await import('crypto');
    const shareKey = crypto.randomBytes(16).toString('hex');
    
    // Calculer la date d'expiration
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      const match = expiresIn.match(/^(\d+)([dhm])$/);
      if (match) {
        const [_, value, unit] = match;
        if (unit === 'd') {
          expiresAt.setDate(expiresAt.getDate() + parseInt(value, 10));
        } else if (unit === 'h') {
          expiresAt.setHours(expiresAt.getHours() + parseInt(value, 10));
        } else if (unit === 'm') {
          expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(value, 10));
        }
      }
    }
    
    // Créer une nouvelle entrée d'accès pour le partage
    const shareAccess = new MediaAccess({
      path,
      shareKey,
      permissions: {
        read: true,
        write: false,
        delete: false,
        share: false
      },
      expiresAt,
      shareConfig: {
        maxAccesses,
        accessCount: 0,
        password: requirePassword ? await generatePassword() : null,
        requireAccount: options.requireAccount || false
      }
    });
    
    await shareAccess.save();
    
    return shareKey;
  } catch (error) {
    logger.error(`Erreur lors de la génération du token de partage: ${error.message}`);
    throw error;
  }
};

/**
 * Génère un mot de passe aléatoire facile à retenir
 * @returns {Promise<string>} Mot de passe généré
 */
const generatePassword = async () => {
  // Liste de mots faciles à retenir
  const adjectives = ['rouge', 'bleu', 'vert', 'grand', 'petit', 'rapide', 'lent'];
  const nouns = ['chat', 'chien', 'maison', 'voiture', 'arbre', 'montagne', 'rivière'];
  const numbers = ['123', '456', '789', '246', '357'];
  
  // Générer un index aléatoire pour chaque liste
  const crypto = await import('crypto');
  const getRandomInt = (max) => Math.floor(Math.random() * max);
  
  const adj = adjectives[getRandomInt(adjectives.length)];
  const noun = nouns[getRandomInt(nouns.length)];
  const num = numbers[getRandomInt(numbers.length)];
  
  // Composer le mot de passe
  return `${adj}${noun}${num}`;
};

export default {
  validatePath,
  checkUserAccess,
  checkPermission,
  generateShareToken
};