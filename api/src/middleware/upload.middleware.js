// server/middleware/upload.middleware.js
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../utils/logger.js';

// Créer le dossier temporaire s'il n'existe pas
try {
  fs.access(config.media.tempDir).catch(() => {
    fs.mkdir(config.media.tempDir, { recursive: true });
  });
} catch (error) {
  logger.error('Erreur lors de la création du dossier temporaire:', error);
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.media.tempDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// Filtrer les fichiers
const fileFilter = (req, file, cb) => {
  // Liste des types MIME autorisés
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Vidéos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    // Audio
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/json'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
  }
};

// Configuration de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(config.security.maxUploadSize, 10) || 500 * 1024 * 1024, // 500MB par défaut
  }
});

// Middleware d'upload
export const uploadMiddleware = upload;

// Middleware de gestion d'erreur pour multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreur multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Fichier trop volumineux',
        error: 'file_too_large',
        limit: config.security.maxUploadSize
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Erreur lors du téléchargement du fichier',
      error: err.code
    });
  } else if (err) {
    // Autre erreur
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

export default {
  uploadMiddleware,
  handleUploadError
};