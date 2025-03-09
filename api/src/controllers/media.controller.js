// server/controllers/media.controller.js
import { promises as fs, createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { validatePath, checkUserAccess } from '../utils/security.js';
import { getFileType, getFileMetadata } from '../utils/fileTypes.js';
import transcodeService from '../services/transcode.service.js';
import thumbnailService from '../services/thumbnail.service.js';
import cacheService from '../services/cache.service.js';
import ViewHistory from '../models/viewHistory.model.js';

// Obtenir le chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Streamer un fichier média
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const streamMedia = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    const quality = req.query.quality || 'auto';
    const format = req.query.format || 'auto';
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(fullPath).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Enregistrer la vue dans l'historique
    await updateViewHistory(req.user._id, mediaPath);
    
    // En fonction du type de fichier, utiliser la méthode de streaming appropriée
    switch (fileType) {
      case 'video':
        await streamVideo(req, res, fullPath, mediaPath, quality, format);
        break;
      case 'audio':
        await streamAudio(req, res, fullPath);
        break;
      case 'image':
        await serveImage(req, res, fullPath);
        break;
      default:
        return res.status(415).json({
          success: false,
          message: 'Type de fichier non supporté'
        });
    }
  } catch (error) {
    logger.error('Erreur lors du streaming du média:', error);
    next(error);
  }
};

/**
 * Obtenir la miniature d'un fichier média
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getThumbnail = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    const width = parseInt(req.query.width, 10) || 320;
    const height = parseInt(req.query.height, 10) || 180;
    const time = parseInt(req.query.time, 10) || 5;
    const refresh = req.query.refresh === 'true';
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(mediaPath).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Générer ou récupérer la miniature
    const thumbnailPath = await thumbnailService.getThumbnail(
      mediaPath,
      fileType,
      { width, height, time, refresh }
    );
    
    if (!thumbnailPath) {
      return res.status(404).json({
        success: false,
        message: 'Impossible de générer la miniature'
      });
    }
    
    // Envoyer la miniature
    res.sendFile(thumbnailPath, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'  // Mise en cache d'un jour
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la miniature:', error);
    next(error);
  }
};

/**
 * Obtenir les informations détaillées sur un fichier média
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getMediaInfo = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(fullPath).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Obtenir les métadonnées du fichier en fonction de son type
    const metadata = await getFileMetadata(fullPath, fileType);
    
    res.status(200).json({
      success: true,
      type: fileType,
      path: mediaPath,
      metadata
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des métadonnées:', error);
    next(error);
  }
};

/**
 * Obtenir les formats disponibles pour un fichier vidéo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getAvailableFormats = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(fullPath).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    if (fileType !== 'video') {
      return res.status(400).json({
        success: false,
        message: 'Cette API n\'est disponible que pour les fichiers vidéo'
      });
    }
    
    // Obtenir les formats disponibles
    const formats = await transcodeService.getAvailableFormats(mediaPath);
    
    res.status(200).json({
      success: true,
      formats
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des formats disponibles:', error);
    next(error);
  }
};

/**
 * Obtenir les sous-titres disponibles pour un fichier vidéo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSubtitles = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Trouver les fichiers de sous-titres associés
    const subtitles = await findSubtitles(fullPath);
    
    res.status(200).json({
      success: true,
      subtitles
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des sous-titres:', error);
    next(error);
  }
};

/**
 * Obtenir un fichier de sous-titres spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSubtitleFile = async (req, res, next) => {
  try {
    const mediaPath = req.params.path;
    const lang = req.params.lang;
    
    // Valider le chemin
    if (!validatePath(mediaPath)) {
      return res.status(403).json({
        success: false,
        message: 'Chemin non valide'
      });
    }
    
    // Vérifier si l'utilisateur a accès au fichier
    const canAccess = await checkUserAccess(req.user, mediaPath);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce fichier'
      });
    }
    
    // Construire le chemin complet
    const videoDir = path.dirname(path.join(config.media.baseDir, mediaPath));
    const videoName = path.basename(mediaPath, path.extname(mediaPath));
    
    // Chercher le fichier de sous-titres
    const subtitleFormats = ['.vtt', '.srt'];
    let subtitlePath = null;
    
    for (const format of subtitleFormats) {
      const possiblePath = path.join(videoDir, `${videoName}.${lang}${format}`);
      if (existsSync(possiblePath)) {
        subtitlePath = possiblePath;
        break;
      }
    }
    
    if (!subtitlePath) {
      return res.status(404).json({
        success: false,
        message: 'Sous-titres non trouvés'
      });
    }
    
    // Déterminer le type MIME
    const contentType = path.extname(subtitlePath) === '.vtt' 
      ? 'text/vtt' 
      : 'application/x-subrip';
    
    // Envoyer le fichier
    res.set('Content-Type', contentType);
    res.sendFile(subtitlePath);
  } catch (error) {
    logger.error('Erreur lors de la récupération du fichier de sous-titres:', error);
    next(error);
  }
};

/**
 * Récupérer un segment HLS
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getHlsSegment = async (req, res, next) => {
  try {
    const { id, file } = req.params;
    
    // Construire le chemin complet du fichier
    const hlsDir = path.join(config.media.transcodedDir, 'hls', id);
    const filePath = path.join(hlsDir, file);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier HLS non trouvé'
      });
    }
    
    // Déterminer le type MIME
    let contentType = 'application/vnd.apple.mpegurl';
    if (file.endsWith('.ts')) {
      contentType = 'video/mp2t';
    }
    
    // Configurer les en-têtes appropriés
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 heure
    
    // Streamer le fichier
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Erreur lors de la récupération du segment HLS:', error);
    next(error);
  }
};

/**
 * Fonction pour streamer une vidéo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier
 * @param {string} relativePath - Chemin relatif du fichier
 * @param {string} quality - Qualité demandée
 * @param {string} format - Format demandé
 */
export const streamVideo = async (req, res, filePath, relativePath, quality, format) => {
  try {
    // Déterminer le format de sortie en fonction de l'extension et du paramètre
    const fileExtension = path.extname(filePath).toLowerCase();
    
    // Vérifier si le navigateur supporte le format d'origine
    const userAgent = req.headers['user-agent'] || '';
    const acceptHeader = req.headers['accept'] || '';
    
    // Si le format est HLS, utiliser le service de transcodage
    if (format === 'hls') {
      return await streamHLS(req, res, filePath, relativePath, quality);
    }
    
    // Déterminer si le fichier doit être transcodé
    const needsTranscoding = await transcodeService.needsTranscoding(filePath, format);
    
    if (needsTranscoding) {
      // Transcode à la volée ou utiliser une version préalablement transcodée
      return await transcodeService.streamTranscoded(req, res, filePath, relativePath, quality, format);
    }
    
    // Si aucun transcodage n'est nécessaire, streamer directement le fichier
    streamRaw(req, res, filePath);
  } catch (error) {
    logger.error('Erreur lors du streaming de la vidéo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming de la vidéo'
    });
  }
};

/**
 * Fonction pour streamer un fichier audio
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier
 */
export const streamAudio = async (req, res, filePath) => {
  try {
    // Déterminer le type MIME
    const mimeType = mime.lookup(filePath) || 'audio/mpeg';
    
    // Streamer le fichier avec support des plages
    streamRaw(req, res, filePath, mimeType);
  } catch (error) {
    logger.error('Erreur lors du streaming audio:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming audio'
    });
  }
};

/**
 * Fonction pour servir une image
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier
 */
export const serveImage = async (req, res, filePath) => {
  try {
    // Paramètres optionnels pour le redimensionnement
    const width = parseInt(req.query.width, 10) || null;
    const height = parseInt(req.query.height, 10) || null;
    
    if (width || height) {
      // Si des dimensions sont spécifiées, redimensionner l'image
      const resizedImageBuffer = await thumbnailService.resizeImage(filePath, width, height);
      const mimeType = mime.lookup(filePath) || 'image/jpeg';
      
      res.set('Content-Type', mimeType);
      res.set('Cache-Control', 'public, max-age=86400'); // 1 jour
      return res.send(resizedImageBuffer);
    }
    
    // Sinon, servir l'image directement
    const mimeType = mime.lookup(filePath) || 'image/jpeg';
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400'); // 1 jour
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Erreur lors du service de l\'image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du service de l\'image'
    });
  }
};

/**
 * Fonction pour streamer un fichier brut avec support des plages
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier
 * @param {string} contentType - Type MIME du contenu
 */
export const streamRaw = async (req, res, filePath, contentType = null) => {
  try {
    // Obtenir les statistiques du fichier
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    
    // Déterminer le type de contenu
    if (!contentType) {
      contentType = mime.lookup(filePath) || 'application/octet-stream';
    }
    
    // Gérer les requêtes de plage
    const range = req.headers.range;
    
    if (range) {
      // Analyser la plage demandée
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Calculer la taille du chunk
      const chunkSize = (end - start) + 1;
      const maxChunkSize = config.streaming.chunkSize || 1024 * 1024; // 1MB par défaut
      
      // Limiter la taille du chunk si nécessaire
      const actualEnd = Math.min(end, start + maxChunkSize - 1);
      const actualChunkSize = (actualEnd - start) + 1;
      
      // Créer un stream de lecture pour la plage demandée
      const file = createReadStream(filePath, { start, end: actualEnd });
      
      // Configurer les en-têtes de réponse
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${actualEnd}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': actualChunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600' // 1 heure
      });
      
      // Streamer le fichier
      file.pipe(res);
    } else {
      // Requête complète
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600' // 1 heure
      });
      
      const file = createReadStream(filePath);
      file.pipe(res);
    }
  } catch (error) {
    logger.error('Erreur lors du streaming brut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming du fichier'
    });
  }
};

/**
 * Fonction pour streamer une vidéo en HLS
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier
 * @param {string} relativePath - Chemin relatif du fichier
 * @param {string} quality - Qualité demandée
 */
export const streamHLS = async (req, res, filePath, relativePath, quality) => {
  try {
    const result = await transcodeService.prepareHLS(filePath, relativePath, quality);
    
    if (result.status === 'ready') {
      // Rediriger vers le manifeste HLS
      res.redirect(result.manifestUrl);
    } else if (result.status === 'preparing') {
      // Informer le client que le transcodage est en cours
      res.status(202).json({
        success: true,
        status: 'preparing',
        message: 'Préparation du stream HLS en cours',
        eta: result.eta
      });
    } else {
      // Erreur lors de la préparation
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la préparation du stream HLS'
      });
    }
  } catch (error) {
    logger.error('Erreur lors du streaming HLS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming HLS'
    });
  }
};

/**
 * Fonction pour trouver les fichiers de sous-titres associés à une vidéo
 * @param {string} videoPath - Chemin complet du fichier vidéo
 * @returns {Array} Liste des sous-titres disponibles
 */
const findSubtitles = async (videoPath) => {
  try {
    const videoDir = path.dirname(videoPath);
    const videoName = path.basename(videoPath, path.extname(videoPath));
    
    // Lire le contenu du dossier
    const files = await fs.readdir(videoDir);
    
    const subtitles = [];
    const subtitleRegex = new RegExp(`^${videoName}\\.(\\w+)\\.(vtt|srt)$`);
    
    for (const file of files) {
      const match = file.match(subtitleRegex);
      if (match) {
        const lang = match[1];
        const format = match[2];
        
        subtitles.push({
          lang,
          format,
          label: getLanguageLabel(lang),
          url: `/api/media/subtitle/${path.relative(config.media.baseDir, videoPath)}/${lang}`
        });
      }
    }
    
    return subtitles;
  } catch (error) {
    logger.error('Erreur lors de la recherche des sous-titres:', error);
    return [];
  }
};

/**
 * Mettre à jour l'historique de visualisation d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} mediaPath - Chemin du fichier consulté
 */
const updateViewHistory = async (userId, mediaPath) => {
  try {
    // Chercher une entrée existante
    let history = await ViewHistory.findOne({
      user: userId,
      path: mediaPath
    });
    
    if (history) {
      // Mettre à jour l'entrée existante
      history.lastViewed = new Date();
      history.viewCount += 1;
    } else {
      // Créer une nouvelle entrée
      history = new ViewHistory({
        user: userId,
        path: mediaPath
      });
    }
    
    await history.save();
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'historique de visualisation: ${error.message}`);
    // Une erreur ici ne doit pas interrompre la diffusion du média
  }
};

/**
 * Fonction pour obtenir le nom complet d'une langue à partir de son code
 * @param {string} langCode - Code de langue (fr, en, etc.)
 * @returns {string} Nom complet de la langue
 */
const getLanguageLabel = (langCode) => {
  const languages = {
    'fr': 'Français',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien',
    'pt': 'Portugais',
    'ru': 'Russe',
    'ja': 'Japonais',
    'zh': 'Chinois',
    'ar': 'Arabe'
  };
  
  return languages[langCode] || langCode;
};

export default {
  streamMedia,
  getThumbnail,
  getMediaInfo,
  getAvailableFormats,
  getSubtitles,
  getSubtitleFile,
  getHlsSegment,
  streamVideo,
  streamAudio,
  serveImage,
  streamRaw,
  streamHLS
};