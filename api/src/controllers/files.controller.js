// server/controllers/files.controller.js
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MediaAccess from '../models/mediaAccess.model.js';
import Folder from '../models/folder.model.js';
import ViewHistory from '../models/viewHistory.model.js';
import { validatePath, checkUserAccess, checkPermission, generateShareToken } from '../utils/security.js';
import { getFileType, getFileMetadata } from '../utils/fileTypes.js';
import thumbnailService from '../services/thumbnail.service.js';
import { createHttpError } from '../middleware/error.middleware.js';

// Obtenir le chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Récupérer la liste des fichiers et dossiers
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
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
          
          // Obtenir les statistiques
          const stats = await fs.stat(path.join(fullPath, item.name));
          
          return {
            name: item.name,
            path: subPath,
            type: 'folder',
            modified: stats.mtime,
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
          
          // Vérifier si le fichier est un favori
          const isFavorite = await checkIfFavorite(req.user._id, relativePath);
          
          // Récupérer les métadonnées du fichier
          const metadata = await getFileMetadata(filePath, type);
          
          return {
            name: item.name,
            type,
            size: stats.size,
            path: relativePath,
            modified: stats.mtime,
            favorite: isFavorite,
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
 * Rechercher des fichiers
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
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
 * Récupérer les fichiers récemment consultés
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getRecentFiles = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // Récupérer l'historique de visualisation
    const history = await ViewHistory.find({ 
      user: req.user._id 
    })
    .sort({ lastViewed: -1 })
    .limit(limit);
    
    // Récupérer les détails de chaque fichier
    const recentFiles = await Promise.all(
      history.map(async (entry) => {
        try {
          const fullPath = path.join(config.media.baseDir, entry.path);
          const stats = await fs.stat(fullPath);
          const fileExtension = path.extname(entry.path).toLowerCase();
          const type = getFileType(fileExtension);
          
          // Créer l'URL de la miniature
          const thumbnailUrl = await thumbnailService.getThumbnailUrl(entry.path, type);
          
          // Vérifier si le fichier est un favori
          const isFavorite = await checkIfFavorite(req.user._id, entry.path);
          
          return {
            name: path.basename(entry.path),
            type,
            size: stats.size,
            path: entry.path,
            modified: stats.mtime,
            favorite: isFavorite,
            thumbnail: thumbnailUrl,
            lastViewed: entry.lastViewed
          };
        } catch (error) {
          // Si le fichier n'existe plus, le supprimer de l'historique
          await ViewHistory.deleteOne({ _id: entry._id });
          return null;
        }
      })
    );
    
    // Filtrer les fichiers qui n'existent plus
    const validFiles = recentFiles.filter(file => file !== null);
    
    res.status(200).json({
      success: true,
      files: validFiles
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des fichiers récents:', error);
    next(error);
  }
};

/**
 * Récupérer les collections de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
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
 * Créer une nouvelle collection
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
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
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'collection_create',
      userId: req.user._id,
      details: {
        collectionId: collection._id,
        name: collection.name
      },
      ip: req.ip
    });
    
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
 * Récupérer une collection par ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Trouver la collection
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
    
    res.status(200).json({
      success: true,
      collection
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la collection:', error);
    next(error);
  }
};

/**
 * Récupérer les éléments d'une collection
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getCollectionItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Trouver la collection
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
    
    // Récupérer les détails de chaque fichier dans la collection
    const items = await Promise.all(
      collection.items.map(async (itemPath) => {
        try {
          const fullPath = path.join(config.media.baseDir, itemPath);
          const stats = await fs.stat(fullPath);
          const fileExtension = path.extname(itemPath).toLowerCase();
          const type = getFileType(fileExtension);
          
          // Créer l'URL de la miniature
          const thumbnailUrl = await thumbnailService.getThumbnailUrl(itemPath, type);
          
          return {
            name: path.basename(itemPath),
            type,
            size: stats.size,
            path: itemPath,
            modified: stats.mtime,
            thumbnail: thumbnailUrl
          };
        } catch (error) {
          // Si le fichier n'existe plus, retourner un objet avec une erreur
          return {
            path: itemPath,
            error: 'Fichier non trouvé',
            exists: false
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des éléments de la collection:', error);
    next(error);
  }
};

/**
 * Ajouter un élément à une collection
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const addToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { path: itemPath } = req.body;
    
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
    const canAccess = await checkUserAccess(req.user, itemPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Vérifier si le fichier existe
    const fullPath = path.join(config.media.baseDir, itemPath);
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Ajouter le fichier à la collection s'il n'y est pas déjà
    if (!collection.items.includes(itemPath)) {
      collection.items.push(itemPath);
      await collection.save();
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: 'collection_add_item',
        userId: req.user._id,
        details: {
          collectionId: collection._id,
          collectionName: collection.name,
          itemPath
        },
        ip: req.ip
      });
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
 * Retirer un élément d'une collection
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const removeFromCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { path: itemPath } = req.body;
    
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
    
    // Retirer le fichier de la collection
    collection.items = collection.items.filter(path => path !== itemPath);
    await collection.save();
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'collection_remove_item',
      userId: req.user._id,
      details: {
        collectionId: collection._id,
        collectionName: collection.name,
        itemPath
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Élément retiré de la collection'
    });
  } catch (error) {
    logger.error('Erreur lors du retrait de l\'élément de la collection:', error);
    next(error);
  }
};

/**
 * Supprimer une collection
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    
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
    
    // Supprimer la collection
    await Folder.deleteOne({ _id: id });
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'collection_delete',
      userId: req.user._id,
      details: {
        collectionId: id,
        collectionName: collection.name
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Collection supprimée'
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la collection:', error);
    next(error);
  }
};

/**
 * Récupérer les favoris de l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
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
      files: [],
      collections: []
    };
    
    // Récupérer les fichiers favoris
    const favFiles = await Favorite.find({
      user: req.user._id,
      type: 'file'
    }).sort({ createdAt: -1 });
    
    // Récupérer les détails de chaque fichier favori
    favorites.files = await Promise.all(
      favFiles.map(async (fav) => {
        try {
          const fullPath = path.join(config.media.baseDir, fav.path);
          const stats = await fs.stat(fullPath);
          const fileExtension = path.extname(fav.path).toLowerCase();
          const type = getFileType(fileExtension);
          
          // Créer l'URL de la miniature
          const thumbnailUrl = await thumbnailService.getThumbnailUrl(fav.path, type);
          
          return {
            name: path.basename(fav.path),
            type,
            size: stats.size,
            path: fav.path,
            modified: stats.mtime,
            thumbnail: thumbnailUrl,
            favorite: true
          };
        } catch (error) {
          // Si le fichier n'existe plus, le supprimer des favoris
          await Favorite.deleteOne({ _id: fav._id });
          return null;
        }
      })
    );
    
    // Filtrer les fichiers qui n'existent plus
    favorites.files = favorites.files.filter(file => file !== null);
    
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
      description: collection.description,
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
 * Ajouter ou retirer un élément des favoris
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const { path: itemPath, type, favorite } = req.body;
    
    if (type === 'folder') {
      // Vérifier si le dossier existe déjà dans la base de données
      let folder = await Folder.findOne({
        path: itemPath,
        owner: req.user._id,
        isCollection: false
      });
      
      if (!folder) {
        // Créer une entrée pour le dossier s'il n'existe pas
        folder = new Folder({
          name: itemPath.split('/').pop() || itemPath,
          path: itemPath,
          owner: req.user._id,
          isCollection: false,
          favorite
        });
      } else {
        folder.favorite = favorite;
      }
      
      await folder.save();
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: favorite ? 'add_favorite' : 'remove_favorite',
        userId: req.user._id,
        details: {
          type,
          path: itemPath
        },
        ip: req.ip
      });
    } else if (type === 'collection') {
      // Pour les collections, on utilise l'ID dans le champ path
      const collection = await Folder.findOne({
        _id: itemPath,
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
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: favorite ? 'add_favorite' : 'remove_favorite',
        userId: req.user._id,
        details: {
          type,
          collectionId: collection._id,
          collectionName: collection.name
        },
        ip: req.ip
      });
    } else if (type === 'file') {
      // Vérifier si le fichier existe
      const fullPath = path.join(config.media.baseDir, itemPath);
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Fichier non trouvé'
        });
      }
      
      // Ajouter ou supprimer des favoris
      if (favorite) {
        // Vérifier si déjà en favori
        const existingFav = await Favorite.findOne({
          user: req.user._id,
          path: itemPath,
          type: 'file'
        });
        
        if (!existingFav) {
          const fav = new Favorite({
            user: req.user._id,
            path: itemPath,
            type: 'file'
          });
          
          await fav.save();
        }
      } else {
        // Supprimer des favoris
        await Favorite.deleteOne({
          user: req.user._id,
          path: itemPath,
          type: 'file'
        });
      }
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: favorite ? 'add_favorite' : 'remove_favorite',
        userId: req.user._id,
        details: {
          type,
          path: itemPath
        },
        ip: req.ip
      });
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
 * Télécharger un fichier sur le serveur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const uploadFile = async (req, res, next) => {
  try {
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier téléchargé'
      });
    }
    
    const uploadedFile = req.file;
    const destPath = req.query.path || '';
    
    // Valider le chemin de destination
    if (!validatePath(destPath)) {
      // Supprimer le fichier temporaire
      await fs.unlink(uploadedFile.path);
      
      return res.status(403).json({
        success: false,
        message: 'Chemin de destination non valide'
      });
    }
    
    // Vérifier si l'utilisateur a les droits d'écriture dans ce dossier
    const canWrite = await checkPermission(req.user, destPath, 'write');
    if (!canWrite) {
      // Supprimer le fichier temporaire
      await fs.unlink(uploadedFile.path);
      
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits d\'écriture dans ce dossier'
      });
    }
    
    // Construire le chemin complet de destination
    const destDir = path.join(config.media.baseDir, destPath);
    
    // Vérifier si le dossier de destination existe
    try {
      await fs.access(destDir);
    } catch (error) {
      // Créer le dossier s'il n'existe pas
      await fs.mkdir(destDir, { recursive: true });
    }
    
    // Construire le chemin final du fichier
    const fileName = uploadedFile.originalname;
    const filePath = path.join(destDir, fileName);
    
    // Vérifier si le fichier existe déjà
    try {
      await fs.access(filePath);
      
      // Générer un nom unique
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const timestamp = Date.now();
      const newFileName = `${baseName}_${timestamp}${ext}`;
      
      // Nouveau chemin
      const newFilePath = path.join(destDir, newFileName);
      
      // Déplacer le fichier temporaire vers la destination finale
      await fs.rename(uploadedFile.path, newFilePath);
      
      // Construire le chemin relatif pour la réponse
      const relativePath = path.join(destPath, newFileName);
      
      // Déterminer le type de fichier
      const fileExtension = path.extname(newFileName).toLowerCase();
      const fileType = getFileType(fileExtension);
      
      // Récupérer les statistiques du fichier
      const stats = await fs.stat(newFilePath);
      
      // Ajouter une entrée au journal d'activité
      await createActivityLog({
        action: 'upload_file',
        userId: req.user._id,
        details: {
          path: relativePath,
          size: stats.size,
          type: fileType
        },
        ip: req.ip
      });
      
      // Renvoyer les informations sur le fichier
      return res.status(201).json({
        success: true,
        message: 'Fichier téléchargé avec succès (renommé car existe déjà)',
        file: {
          name: newFileName,
          path: relativePath,
          size: stats.size,
          type: fileType
        }
      });
    } catch (error) {
      // Le fichier n'existe pas, on peut continuer
    }
    
    // Déplacer le fichier temporaire vers la destination finale
    await fs.rename(uploadedFile.path, filePath);
    
    // Construire le chemin relatif pour la réponse
    const relativePath = path.join(destPath, fileName);
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(fileName).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Récupérer les statistiques du fichier
    const stats = await fs.stat(filePath);
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'upload_file',
      userId: req.user._id,
      details: {
        path: relativePath,
        size: stats.size,
        type: fileType
      },
      ip: req.ip
    });
    
    // Renvoyer les informations sur le fichier
    res.status(201).json({
      success: true,
      message: 'Fichier téléchargé avec succès',
      file: {
        name: fileName,
        path: relativePath,
        size: stats.size,
        type: fileType
      }
    });
  } catch (error) {
    logger.error('Erreur lors du téléchargement du fichier:', error);
    
    // Tenter de supprimer le fichier temporaire en cas d'erreur
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Erreur lors de la suppression du fichier temporaire:', unlinkError);
      }
    }
    
    next(error);
  }
};

/**
 * Partager un fichier ou un dossier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const shareMedia = async (req, res, next) => {
  try {
    const { path: mediaPath, expiresIn, requirePassword, maxAccesses, requireAccount } = req.body;
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès à ce fichier ou dossier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier ou dossier'
      });
    }
    
    // Vérifier si l'utilisateur a les droits de partage
    const canShare = await checkPermission(req.user, mediaPath, 'share');
    if (!canShare) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits de partage pour ce fichier ou dossier'
      });
    }
    
    // Vérifier si le fichier ou dossier existe
    const fullPath = path.join(config.media.baseDir, mediaPath);
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier ou dossier non trouvé'
      });
    }
    
    // Générer un token de partage
    const shareOptions = {
      expiresIn: expiresIn || '7d',
      requirePassword: requirePassword === true,
      maxAccesses: maxAccesses || 0,
      requireAccount: requireAccount === true
    };
    
    const shareToken = await generateShareToken(mediaPath, shareOptions);
    
    // Récupérer le partage créé pour obtenir le mot de passe généré si nécessaire
    const share = await MediaAccess.findOne({ shareKey: shareToken });
    
    // URL de partage
    const shareUrl = `${config.server.corsOrigin}/share/${shareToken}`;
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'share_media',
      userId: req.user._id,
      details: {
        path: mediaPath,
        shareId: share._id,
        expiresIn,
        requirePassword,
        maxAccesses
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      shareId: share._id,
      shareToken,
      shareUrl,
      password: shareOptions.requirePassword ? share.shareConfig.password : null,
      expiresAt: share.expiresAt
    });
  } catch (error) {
    logger.error('Erreur lors du partage de média:', error);
    next(error);
  }
};

/**
 * Récupérer les éléments partagés par l'utilisateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSharedItems = async (req, res, next) => {
  try {
    // Récupérer les partages de l'utilisateur
    const shares = await MediaAccess.find({
      user: req.user._id,
      shareKey: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });
    
    // Préparer la réponse avec des informations supplémentaires
    const sharedItems = await Promise.all(
      shares.map(async share => {
        try {
          // Vérifier si le fichier ou dossier existe toujours
          const fullPath = path.join(config.media.baseDir, share.path);
          const stats = await fs.stat(fullPath);
          
          // Déterminer s'il s'agit d'un fichier ou d'un dossier
          const isDirectory = stats.isDirectory();
          
          // Pour les fichiers, obtenir des métadonnées supplémentaires
          let media = {
            name: path.basename(share.path),
            path: share.path,
            type: isDirectory ? 'folder' : getFileType(path.extname(share.path).toLowerCase()),
            size: isDirectory ? null : stats.size
          };
          
          // Ajouter une URL de miniature pour les fichiers
          if (!isDirectory) {
            const thumbnailUrl = await thumbnailService.getThumbnailUrl(share.path, media.type);
            media.thumbnail = thumbnailUrl;
          }
          
          return {
            _id: share._id,
            media,
            shareUrl: `${config.server.corsOrigin}/share/${share.shareKey}`,
            createdAt: share.createdAt,
            expiresAt: share.expiresAt,
            accessCount: share.shareConfig ? share.shareConfig.accessCount : 0,
            maxAccesses: share.shareConfig ? share.shareConfig.maxAccesses : 0,
            requiresPassword: !!(share.shareConfig && share.shareConfig.password),
            requiresAccount: !!(share.shareConfig && share.shareConfig.requireAccount)
          };
        } catch (error) {
          // Si le fichier n'existe plus, retourner l'information de base
          return {
            _id: share._id,
            media: {
              name: path.basename(share.path),
              path: share.path,
              exists: false
            },
            shareUrl: `${config.server.corsOrigin}/share/${share.shareKey}`,
            createdAt: share.createdAt,
            expiresAt: share.expiresAt,
            accessCount: share.shareConfig ? share.shareConfig.accessCount : 0,
            maxAccesses: share.shareConfig ? share.shareConfig.maxAccesses : 0
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      shares: sharedItems
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des éléments partagés:', error);
    next(error);
  }
};

/**
 * Supprimer un partage
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const deleteShare = async (req, res, next) => {
  try {
    const { shareId } = req.params;
    
    // Vérifier si le partage existe et appartient à l'utilisateur
    const share = await MediaAccess.findOne({
      _id: shareId,
      user: req.user._id,
      shareKey: { $exists: true, $ne: null }
    });
    
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Partage non trouvé'
      });
    }
    
    // Supprimer le partage
    await MediaAccess.deleteOne({ _id: shareId });
    
    // Ajouter une entrée au journal d'activité
    await createActivityLog({
      action: 'delete_share',
      userId: req.user._id,
      details: {
        shareId,
        path: share.path
      },
      ip: req.ip
    });
    
    res.status(200).json({
      success: true,
      message: 'Partage supprimé'
    });
  } catch (error) {
    logger.error('Erreur lors de la suppression du partage:', error);
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
          
          // Vérifier si le fichier est un favori
          const isFavorite = await checkIfFavorite(user._id, itemRelativePath);
          
          results.push({
            name: item.name,
            type,
            size: stats.size,
            path: itemRelativePath,
            modified: stats.mtime,
            favorite: isFavorite,
            thumbnail: thumbnailUrl
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
 * Vérifier si un fichier est un favori pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<boolean>} Est-ce un favori
 */
const checkIfFavorite = async (userId, filePath) => {
  try {
    const favoriteCount = await Favorite.countDocuments({
      user: userId,
      path: filePath,
      type: 'file'
    });
    
    return favoriteCount > 0;
  } catch (error) {
    logger.error(`Erreur lors de la vérification des favoris pour ${filePath}:`, error);
    return false;
  }
};

/**
 * Créer une entrée dans le journal d'activité
 * @param {Object} data - Données de l'activité
 * @returns {Promise} Promise résolue avec l'entrée créée
 */
const createActivityLog = async (data) => {
  try {
    // Importer le modèle du journal d'activité
    const ActivityLog = await import('../models/activityLog.model.js').then(m => m.default);
    
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
  getFiles,
  searchFiles,
  getRecentFiles,
  getCollections,
  createCollection,
  getCollection,
  getCollectionItems,
  addToCollection,
  removeFromCollection,
  deleteCollection,
  getFavorites,
  toggleFavorite,
  uploadFile,
  shareMedia,
  getSharedItems,
  deleteShare
};