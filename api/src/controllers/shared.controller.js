// server/controllers/shared.controller.js
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MediaAccess from '../models/mediaAccess.model.js';
import thumbnailService from '../services/thumbnail.service.js';
import { getFileType, getFileMetadata } from '../utils/fileTypes.js';
import mediaController from './media.controller.js';

/**
 * Récupérer les informations sur un contenu partagé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getSharedInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Vérifier si le token de partage est valide
    const share = await MediaAccess.findOne({
      shareKey: token,
      expiresAt: { $gt: new Date() }
    });
    
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Contenu partagé non trouvé ou expiré'
      });
    }
    
    // Vérifier si le nombre maximal d'accès a été atteint
    if (share.shareConfig && 
        share.shareConfig.maxAccesses > 0 && 
        share.shareConfig.accessCount >= share.shareConfig.maxAccesses) {
      return res.status(403).json({
        success: false,
        message: 'Nombre maximal d\'accès atteint'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, share.path);
    
    // Vérifier si le fichier ou dossier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Le contenu partagé n\'existe plus'
      });
    }
    
    // Déterminer s'il s'agit d'un fichier ou d'un dossier
    const stats = await fs.stat(fullPath);
    const isDirectory = stats.isDirectory();
    
    // Informations de base sur le contenu partagé
    const mediaInfo = {
      name: path.basename(share.path),
      type: isDirectory ? 'folder' : getFileType(path.extname(share.path).toLowerCase()),
      size: isDirectory ? null : stats.size,
      isDirectory,
      createdAt: share.createdAt
    };
    
    // Si c'est un fichier, ajouter des métadonnées supplémentaires
    if (!isDirectory) {
      const metadata = await getFileMetadata(fullPath, mediaInfo.type);
      mediaInfo.metadata = metadata;
    }
    
    // Déterminer si un mot de passe est requis
    const passwordRequired = !!(share.shareConfig && share.shareConfig.password);
    
    // Déterminer si un compte est requis
    const accountRequired = !!(share.shareConfig && share.shareConfig.requireAccount);
    
    // Si un compte est requis et que l'utilisateur n'est pas connecté
    if (accountRequired && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise pour accéder à ce contenu',
        requireAccount: true
      });
    }
    
    // Incrémenter le compteur d'accès
    if (share.shareConfig) {
      share.shareConfig.accessCount = (share.shareConfig.accessCount || 0) + 1;
      await share.save();
    }
    
    res.status(200).json({
      success: true,
      media: mediaInfo,
      passwordRequired,
      accountRequired
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des informations sur le contenu partagé:', error);
    next(error);
  }
};

/**
 * Accéder à un contenu partagé protégé par mot de passe
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const accessSharedContent = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Vérifier si le token de partage est valide
    const share = await MediaAccess.findOne({
      shareKey: token,
      expiresAt: { $gt: new Date() }
    });
    
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Contenu partagé non trouvé ou expiré'
      });
    }
    
    // Vérifier si un mot de passe est requis
    if (!share.shareConfig || !share.shareConfig.password) {
      return res.status(400).json({
        success: false,
        message: 'Aucun mot de passe requis pour ce contenu'
      });
    }
    
    // Vérifier le mot de passe
    if (share.shareConfig.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }
    
    // Générer un token d'accès temporaire
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    // Stocker le token dans la session
    if (!req.session) {
      req.session = {};
    }
    
    // Stocker le token d'accès dans un cookie
    res.cookie('share_auth_' + token, accessToken, {
      httpOnly: true,
      secure: config.server.env === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });
    
    res.status(200).json({
      success: true,
      message: 'Accès accordé',
      accessToken
    });
  } catch (error) {
    logger.error('Erreur lors de l\'accès au contenu partagé:', error);
    next(error);
  }
};

/**
 * Streamer un média partagé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const streamSharedMedia = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { accessToken } = req.query;
    const quality = req.query.quality || 'auto';
    const format = req.query.format || 'auto';
    
    // Vérifier le token de partage
    if (!req.shareInfo || !req.shareInfo.path) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, req.shareInfo.path);
    
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
    const fileExtension = path.extname(req.shareInfo.path).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Utiliser le contrôleur média pour streamer le fichier
    switch (fileType) {
      case 'video':
        await mediaController.streamVideo(req, res, fullPath, req.shareInfo.path, quality, format);
        break;
      case 'audio':
        await mediaController.streamAudio(req, res, fullPath);
        break;
      case 'image':
        await mediaController.serveImage(req, res, fullPath);
        break;
      default:
        return res.status(415).json({
          success: false,
          message: 'Type de fichier non supporté'
        });
    }
  } catch (error) {
    logger.error('Erreur lors du streaming du média partagé:', error);
    next(error);
  }
};

/**
 * Obtenir la miniature d'un média partagé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const getThumbnailShared = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { accessToken } = req.query;
    const width = parseInt(req.query.width, 10) || 320;
    const height = parseInt(req.query.height, 10) || 180;
    const time = parseInt(req.query.time, 10) || 5;
    
    // Vérifier le token de partage
    if (!req.shareInfo || !req.shareInfo.path) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    // Déterminer le type de fichier
    const fileExtension = path.extname(req.shareInfo.path).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Générer ou récupérer la miniature
    const thumbnailPath = await thumbnailService.getThumbnail(
      req.shareInfo.path,
      fileType,
      { width, height, time }
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
    logger.error('Erreur lors de la récupération de la miniature partagée:', error);
    next(error);
  }
};

/**
 * Télécharger un fichier partagé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
export const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { accessToken } = req.query;
    
    // Vérifier le token de partage
    if (!req.shareInfo || !req.shareInfo.path) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    
    // Construire le chemin complet
    const fullPath = path.join(config.media.baseDir, req.shareInfo.path);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }
    
    // Vérifier si c'est un fichier (pas un dossier)
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de télécharger un dossier'
      });
    }
    
    // Déterminer le type MIME
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';
    
    // Nom du fichier pour le téléchargement
    const fileName = path.basename(req.shareInfo.path);
    
    // Configurer les en-têtes pour le téléchargement
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    
    // Streamer le fichier
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Erreur lors du téléchargement du fichier partagé:', error);
    next(error);
  }
};

export default {
  getSharedInfo,
  accessSharedContent,
  streamSharedMedia,
  getThumbnailShared,
  downloadSharedFile
};