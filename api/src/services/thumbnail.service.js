// server/services/thumbnail.service.js
import path from 'path';
import { promises as fs, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

// Obtenir le chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S'assurer que les dossiers nécessaires existent
const ensureDirectories = () => {
  try {
    // Créer les dossiers s'ils n'existent pas
    mkdirSync(config.media.thumbnailsDir, { recursive: true });
    
    // Créer les sous-dossiers pour chaque type de média
    mkdirSync(path.join(config.media.thumbnailsDir, 'video'), { recursive: true });
    mkdirSync(path.join(config.media.thumbnailsDir, 'image'), { recursive: true });
    mkdirSync(path.join(config.media.thumbnailsDir, 'folder'), { recursive: true });
    
    logger.info('Dossiers de miniatures créés avec succès');
  } catch (error) {
    logger.error('Erreur lors de la création des dossiers de miniatures:', error);
  }
};

// Initialiser les dossiers au démarrage
ensureDirectories();

/**
 * Génère ou récupère une URL de miniature pour un fichier
 * @param {string} mediaPath - Chemin relatif du fichier
 * @param {string} type - Type de fichier (video, image)
 * @returns {Promise<string>} URL de la miniature
 */
const getThumbnailUrl = async (mediaPath, type) => {
  try {
    // Générer un hash du chemin pour l'utiliser comme nom de fichier
    const hash = crypto.createHash('md5').update(mediaPath).digest('hex');
    
    // Construire l'URL de la miniature
    return `/api/media/thumbnail/${encodeURIComponent(mediaPath)}`;
  } catch (error) {
    logger.error('Erreur lors de la génération de l\'URL de miniature:', error);
    return null;
  }
};

/**
 * Génère ou récupère une miniature pour un fichier
 * @param {string} mediaPath - Chemin relatif du fichier
 * @param {string} type - Type de fichier (video, image)
 * @param {Object} options - Options de génération
 * @returns {Promise<string>} Chemin de la miniature générée
 */
const getThumbnail = async (mediaPath, type, options = {}) => {
  try {
    const { width = 320, height = 180, time = 5, refresh = false } = options;
    
    // Générer un hash du chemin et des options pour l'utiliser comme nom de fichier
    const optionsString = `${width}x${height}_${time}`;
    const hash = crypto.createHash('md5').update(mediaPath + optionsString).digest('hex');
    
    // Déterminer le dossier de destination en fonction du type
    const thumbnailDir = path.join(config.media.thumbnailsDir, type);
    const thumbnailPath = path.join(thumbnailDir, `${hash}.jpg`);
    
    // Vérifier si la miniature existe déjà
    if (!refresh && existsSync(thumbnailPath)) {
      return thumbnailPath;
    }
    
    // Construire le chemin complet du fichier original
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    if (!existsSync(fullPath)) {
      logger.error(`Fichier introuvable pour la génération de miniature: ${fullPath}`);
      return null;
    }
    
    // Générer la miniature en fonction du type
    if (type === 'video') {
      return await generateVideoThumbnail(fullPath, thumbnailPath, time, width, height);
    } else if (type === 'image') {
      return await generateImageThumbnail(fullPath, thumbnailPath, width, height);
    } else {
      logger.error(`Type de fichier non supporté pour la génération de miniature: ${type}`);
      return null;
    }
  } catch (error) {
    logger.error('Erreur lors de la génération de miniature:', error);
    return null;
  }
};

/**
 * Génère une miniature pour une vidéo
 * @param {string} videoPath - Chemin complet de la vidéo
 * @param {string} outputPath - Chemin de sortie pour la miniature
 * @param {number} timestamp - Position temporelle en secondes
 * @param {number} width - Largeur souhaitée
 * @param {number} height - Hauteur souhaitée
 * @returns {Promise<string>} Chemin de la miniature générée
 */
const generateVideoThumbnail = (videoPath, outputPath, timestamp, width, height) => {
  return new Promise((resolve, reject) => {
    // Déterminer la durée de la vidéo pour choisir un timestamp valide
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Récupérer la durée en secondes
        const duration = metadata.format.duration || 0;
        
        // Vérifier que le timestamp est valide
        let validTimestamp = timestamp;
        
        if (duration > 0) {
          // Si le timestamp est supérieur à la durée, prendre 20% de la durée
          if (timestamp >= duration) {
            validTimestamp = Math.max(1, Math.floor(duration * 0.2));
          }
          
          // Éviter les 3 premières secondes (souvent un écran noir)
          if (validTimestamp < 3 && duration > 6) {
            validTimestamp = 3;
          }
        }
        
        // Générer la miniature avec FFmpeg
        ffmpeg(videoPath)
          .on('end', () => {
            logger.info(`Miniature générée avec succès: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            logger.error(`Erreur lors de la génération de miniature vidéo: ${error.message}`);
            reject(error);
          })
          .screenshots({
            count: 1,
            folder: path.dirname(outputPath),
            filename: path.basename(outputPath),
            size: `${width}x${height}`,
            timestamps: [validTimestamp]
          });
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Génère une miniature pour une image
 * @param {string} imagePath - Chemin complet de l'image
 * @param {string} outputPath - Chemin de sortie pour la miniature
 * @param {number} width - Largeur souhaitée
 * @param {number} height - Hauteur souhaitée
 * @returns {Promise<string>} Chemin de la miniature générée
 */
const generateImageThumbnail = async (imagePath, outputPath, width, height) => {
  try {
    await sharp(imagePath)
      .resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    logger.info(`Miniature d'image générée avec succès: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error(`Erreur lors de la génération de miniature d'image: ${error.message}`);
    throw error;
  }
};

/**
 * Génère une miniature pour un dossier (basée sur une image/vidéo représentative du dossier)
 * @param {string} folderPath - Chemin relatif du dossier
 * @param {string} folderId - ID du dossier dans la base de données
 * @param {Object} options - Options de génération
 * @returns {Promise<string>} Chemin de la miniature générée
 */
const generateFolderThumbnail = async (folderPath, folderId, options = {}) => {
  try {
    const { width = 320, height = 180 } = options;
    
    // Chemin de sortie de la miniature
    const thumbnailPath = path.join(config.media.thumbnailsDir, 'folder', `${folderId}.jpg`);
    
    // Si une image customisée est fournie, l'utiliser
    if (options.customImage) {
      return await generateImageThumbnail(options.customImage, thumbnailPath, width, height);
    }
    
    // Sinon, chercher une image ou vidéo représentative dans le dossier
    const fullPath = path.join(config.media.baseDir, folderPath);
    
    // Lire le contenu du dossier
    const files = await fs.readdir(fullPath);
    
    // Filtrer les fichiers pour ne garder que les images et vidéos
    const mediaFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return config.media.supportedImageFormats.includes(ext) || 
             config.media.supportedVideoFormats.includes(ext);
    });
    
    // Si aucun fichier média n'est trouvé, générer une miniature par défaut
    if (mediaFiles.length === 0) {
      return await generateDefaultFolderThumbnail(thumbnailPath, width, height);
    }
    
    // Choisir un fichier aléatoire ou le premier
    const selectedFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)];
    const filePath = path.join(fullPath, selectedFile);
    const fileExt = path.extname(selectedFile).toLowerCase();
    
    // Déterminer le type de fichier
    const isImage = config.media.supportedImageFormats.includes(fileExt);
    
    // Générer la miniature en fonction du type
    if (isImage) {
      return await generateImageThumbnail(filePath, thumbnailPath, width, height);
    } else {
      // Pour les vidéos, prendre une capture à un moment aléatoire
      const randomTime = Math.floor(Math.random() * 30) + 5; // Entre 5 et 35 secondes
      return await generateVideoThumbnail(filePath, thumbnailPath, randomTime, width, height);
    }
  } catch (error) {
    logger.error(`Erreur lors de la génération de miniature de dossier: ${error.message}`);
    return null;
  }
};

/**
 * Génère une miniature par défaut pour un dossier
 * @param {string} outputPath - Chemin de sortie pour la miniature
 * @param {number} width - Largeur souhaitée
 * @param {number} height - Hauteur souhaitée
 * @returns {Promise<string>} Chemin de la miniature générée
 */
const generateDefaultFolderThumbnail = async (outputPath, width, height) => {
  try {
    // Créer une image avec un fond uni et un icône de dossier
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 52, g: 152, b: 219, alpha: 1 }
      }
    })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    logger.info(`Miniature de dossier par défaut générée: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error(`Erreur lors de la génération de miniature de dossier par défaut: ${error.message}`);
    throw error;
  }
};

/**
 * Redimensionne une image aux dimensions spécifiées
 * @param {string} imagePath - Chemin de l'image
 * @param {number} width - Largeur souhaitée
 * @param {number} height - Hauteur souhaitée
 * @returns {Promise<Buffer>} Buffer de l'image redimensionnée
 */
const resizeImage = async (imagePath, width, height) => {
  try {
    // Créer une instance de Sharp
    let resizeOptions = {};
    
    if (width && height) {
      resizeOptions = {
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true
      };
    } else if (width) {
      resizeOptions = {
        width,
        withoutEnlargement: true
      };
    } else if (height) {
      resizeOptions = {
        height,
        withoutEnlargement: true
      };
    }
    
    // Redimensionner l'image
    const buffer = await sharp(imagePath)
      .resize(resizeOptions)
      .toBuffer();
    
    return buffer;
  } catch (error) {
    logger.error(`Erreur lors du redimensionnement de l'image: ${error.message}`);
    throw error;
  }
};

export default {
  getThumbnailUrl,
  getThumbnail,
  generateFolderThumbnail,
  resizeImage
};