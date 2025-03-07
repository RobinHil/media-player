// server/controllers/files.controller.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MediaAccess from '../models/mediaAccess.model.js';
import Folder from '../models/folder.model.js';
import { validatePath } from '../utils/security.js';
import { getFileType, getFileMetadata } from '../utils/fileTypes.js';
import thumbnailService from '../services/thumbnail.service.js';

// Obtenir le chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Récupérer la liste des fichiers et dossiers
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: Chemin relatif du dossier (vide pour racine)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, video, image, audio]
 *         description: Filtrer par type de fichier
 *     responses:
 *       200:
 *         description: Liste des fichiers et dossiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 path:
 *                   type: string
 *                 folders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Folder'
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Dossier non trouvé
 */
export const getFiles = async (req, res, next) => {
  try {
    const requestPath = req.query.path || '';
    const fileType = req.query.type || 'all';
    
    // Valider le chemin pour éviter les attaques de traversée de répertoire
    if (!validatePath(requestPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, requestPath);
    
    // Vérifier si l'utilisateur a accès à ce dossier
    const canAccess = await checkUserAccess(req.user, requestPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce dossier'
      });
    }
    
    // Vérifier si le dossier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }
    
    // Lire le contenu du dossier
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    // Traiter les dossiers
    const folders = await Promise.all(
      items
        .filter(item => item.isDirectory())
        .map(async (item) => {
          // Vérifier si l'utilisateur a accès à ce sous-dossier
          const subPath = path.join(requestPath, item.name);
          const hasAccess = await checkUserAccess(req.user, subPath);
          
          if (!hasAccess) return null;
          
          // Récupérer les informations personnalisées du dossier
          const customFolder = await Folder.findOne({ 
            path: subPath,
            owner: req.user._id
          });
          
          return {
            name: item.name,
            path: subPath,
            type: 'folder',
            favorite: customFolder ? customFolder.favorite : false,
            thumbnail: customFolder && customFolder.thumbnail ? 
              `/api/thumbnails/folder/${customFolder._id}` : null,
            metadata: customFolder ? customFolder.metadata : {}
          };
        })
    );
    
    // Filtrer les dossiers auxquels l'utilisateur n'a pas accès
    const accessibleFolders = folders.filter(folder => folder !== null);
    
    // Traiter les fichiers
    const files = await Promise.all(
      items
        .filter(item => item.isFile())
        .map(async (item) => {
          const filePath = path.join(fullPath, item.name);
          const stats = await fs.stat(filePath);
          const fileExtension = path.extname(item.name).toLowerCase();
          const type = getFileType(fileExtension);
          
          // Filtrer par type si nécessaire
          if (fileType !== 'all' && type !== fileType) {
            return null;
          }
          
          // Si le fichier n'est pas supporté, l'ignorer
          if (type === 'unknown') {
            return null;
          }
          
          // Créer l'URL de la miniature
          const relativePath = path.join(requestPath, item.name);
          const thumbnailUrl = await thumbnailService.getThumbnailUrl(relativePath, type);
          
          // Récupérer les métadonnées du fichier
          const metadata = await getFileMetadata(filePath, type);
          
          return {
            name: item.name,
            type,
            size: stats.size,
            path: relativePath,
            modified: stats.mtime,
            thumbnail: thumbnailUrl,
            metadata
          };
        })
    );
    
    // Filtrer les fichiers nuls (non supportés ou filtrés)
    const validFiles = files.filter(file => file !== null);
    
    // Renvoyer les résultats
    res.status(200).json({
      success: true,
      path: requestPath,
      folders: accessibleFolders,
      files: validFiles
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des fichiers:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/search:
 *   get:
 *     summary: Rechercher des fichiers
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, video, image, audio]
 *         description: Filtrer par type de fichier
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 */
export const searchFiles = async (req, res, next) => {
  try {
    const searchQuery = req.query.query;
    const fileType = req.query.type || 'all';
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche trop court'
      });
    }
    
    // Fonction de recherche récursive
    const searchResults = await searchDirectory(config.media.baseDir, '', searchQuery, fileType, req.user);
    
    res.status(200).json({
      success: true,
      results: searchResults
    });
  } catch (error) {
    logger.error('Erreur lors de la recherche de fichiers:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/collections:
 *   get:
 *     summary: Récupérer les collections de l'utilisateur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des collections
 */
export const getCollections = async (req, res, next) => {
  try {
    // Récupérer les collections de l'utilisateur
    const collections = await Folder.find({
      owner: req.user._id,
      isCollection: true
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      collections
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des collections:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/collections:
 *   post:
 *     summary: Créer une nouvelle collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Collection créée avec succès
 */
export const createCollection = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    // Créer une nouvelle collection
    const collection = new Folder({
      name,
      description,
      owner: req.user._id,
      isCollection: true,
      items: []
    });
    
    await collection.save();
    
    res.status(201).json({
      success: true,
      message: 'Collection créée avec succès',
      collection
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la collection:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/collections/{id}/items:
 *   post:
 *     summary: Ajouter un élément à une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Élément ajouté avec succès
 */
export const addToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { path } = req.body;
    
    // Vérifier si la collection existe et appartient à l'utilisateur
    const collection = await Folder.findOne({
      _id: id,
      owner: req.user._id,
      isCollection: true
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection non trouvée'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, path);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Vérifier si le fichier existe
    const fullPath = path.join(config.media.baseDir, path);
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Ajouter le fichier à la collection s'il n'y est pas déjà
    if (!collection.items.includes(path)) {
      collection.items.push(path);
      await collection.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Élément ajouté à la collection'
    });
  } catch (error) {
    logger.error('Erreur lors de l\'ajout à la collection:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/favorites:
 *   get:
 *     summary: Récupérer les favoris de l'utilisateur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des favoris
 */
export const getFavorites = async (req, res, next) => {
  try {
    // Récupérer les dossiers favoris
    const folders = await Folder.find({
      owner: req.user._id,
      favorite: true,
      isCollection: false
    }).sort({ name: 1 });
    
    // Créer un tableau pour les résultats
    const favorites = {
      folders: folders.map(folder => ({
        name: folder.name,
        path: folder.path,
        type: 'folder',
        thumbnail: folder.thumbnail ? `/api/thumbnails/folder/${folder._id}` : null
      })),
      files: []
    };
    
    // Récupérer les collections favorites
    const collections = await Folder.find({
      owner: req.user._id,
      favorite: true,
      isCollection: true
    }).sort({ name: 1 });
    
    // Ajouter les collections aux favoris
    favorites.collections = collections.map(collection => ({
      id: collection._id,
      name: collection.name,
      itemCount: collection.items.length,
      thumbnail: collection.thumbnail ? `/api/thumbnails/folder/${collection._id}` : null
    }));
    
    res.status(200).json({
      success: true,
      favorites
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des favoris:', error);
    next(error);
  }
};

/**
 * @swagger
 * /files/favorites:
 *   post:
 *     summary: Ajouter ou retirer un élément des favoris
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *               - type
 *               - favorite
 *             properties:
 *               path:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [folder, collection]
 *               favorite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Favoris mis à jour avec succès
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { path, type, favorite } = req.body;
    
    if (type === 'folder') {
      // Vérifier si le dossier existe déjà dans la base de données
      let folder = await Folder.findOne({
        path,
        owner: req.user._id,
        isCollection: false
      });
      
      if (!folder) {
        // Créer une entrée pour le dossier s'il n'existe pas
        folder = new Folder({
          name: path.split('/').pop() || path,
          path,
          owner: req.user._id,
          isCollection: false,
          favorite
        });
      } else {
        folder.favorite = favorite;
      }
      
      await folder.save();
    } else if (type === 'collection') {
      // Pour les collections, on utilise l'ID dans le champ path
      const collection = await Folder.findOne({
        _id: path,
        owner: req.user._id,
        isCollection: true
      });
      
      if (!collection) {
        return res.status(404).json({
          success: false,
          message: 'Collection non trouvée'
        });
      }
      
      collection.favorite = favorite;
      await collection.save();
    }
    
    res.status(200).json({
      success: true,
      message: favorite ? 'Ajouté aux favoris' : 'Retiré des favoris'
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des favoris:', error);
    next(error);
  }
};

/**
 * Fonction récursive pour chercher des fichiers dans un répertoire
 * @param {string} dir - Chemin absolu du dossier à explorer
 * @param {string} relativePath - Chemin relatif pour les résultats
 * @param {string} query - Terme de recherche
 * @param {string} fileType - Type de fichier à rechercher
 * @param {Object} user - Utilisateur effectuant la recherche
 * @returns {Array} Résultats de la recherche
 */
const searchDirectory = async (dir, relativePath, query, fileType, user) => {
  const results = [];
  
  try {
    // Vérifier si l'utilisateur a accès à ce dossier
    const canAccess = await checkUserAccess(user, relativePath);
    if (!canAccess) {
      return results;
    }
    
    // Lire le contenu du dossier
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    // Traiter les fichiers
    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      const itemRelativePath = path.join(relativePath, item.name);
      
      if (item.isDirectory()) {
        // Explorer récursivement les sous-dossiers
        const subResults = await searchDirectory(
          itemPath,
          itemRelativePath,
          query,
          fileType,
          user
        );
        results.push(...subResults);
      } else if (item.isFile()) {
        // Vérifier si le fichier correspond à la recherche
        const fileExtension = path.extname(item.name).toLowerCase();
        const type = getFileType(fileExtension);
        
        // Filtrer par type si nécessaire
        if (fileType !== 'all' && type !== fileType) {
          continue;
        }
        
        // Si le fichier n'est pas supporté, l'ignorer
        if (type === 'unknown') {
          continue;
        }
        
        // Vérifier si le nom correspond à la recherche
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        
        if (matchesQuery) {
          const stats = await fs.stat(itemPath);
          const thumbnailUrl = await thumbnailService.getThumbnailUrl(itemRelativePath, type);
          const metadata = await getFileMetadata(itemPath, type);
          
          results.push({
            name: item.name,
            type,
            size: stats.size,
            path: itemRelativePath,
            modified: stats.mtime,
            thumbnail: thumbnailUrl,
            metadata
          });
        }
      }
    }
  } catch (error) {
    logger.error(`Erreur lors de la recherche dans ${dir}:`, error);
  }
  
  return results;
};

/**
 * Vérifier si un utilisateur a accès à un chemin spécifique
 * @param {Object} user - Utilisateur
 * @param {string} path - Chemin relatif
 * @returns {boolean} Si l'utilisateur a accès
 */
const checkUserAccess = async (user, path) => {
  // Les administrateurs ont accès à tout
  if (user.role === 'admin') {
    return true;
  }
  
  // Vérifier les autorisations d'accès
  const access = await MediaAccess.findOne({
    $or: [
      { path: { $regex: `^${path}` }, user: user._id },
      { path: { $regex: `^${path}` }, role: user.role }
    ],
    'permissions.read': true
  });
  
  // Si aucune autorisation spécifique n'est trouvée, vérifier les autorisations par défaut
  if (!access) {
    // Vérifier si le chemin est public (accessible à tous)
    const publicAccess = await MediaAccess.findOne({
      path: { $regex: `^${path}` },
      role: 'user',
      'permissions.read': true
    });
    
    if (publicAccess) {
      return true;
    }
    
    // Si le système est configuré pour permettre l'accès par défaut (pour le développement)
    if (config.server.env === 'development') {
      return true;
    }
    
    return false;
  }
  
  return true;
};

export default {
  getFiles,
  searchFiles,
  getCollections,
  createCollection,
  addToCollection,
  getFavorites,
  toggleFavorite
};