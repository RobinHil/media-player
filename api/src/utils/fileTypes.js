// server/utils/fileTypes.js
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import config from '../config/config.js';
import logger from './logger.js';

/**
 * Détermine le type de fichier en fonction de son extension
 * @param {string} extension - Extension du fichier avec le point (.mp4, .jpg, etc.)
 * @returns {string} Type de fichier (video, image, audio, unknown)
 */
export const getFileType = (extension) => {
  const ext = extension.toLowerCase();
  
  if (config.media.supportedVideoFormats.includes(ext)) {
    return 'video';
  } else if (config.media.supportedImageFormats.includes(ext)) {
    return 'image';
  } else if (config.media.supportedAudioFormats.includes(ext)) {
    return 'audio';
  }
  
  return 'unknown';
};

/**
 * Extrait les métadonnées d'un fichier multimédia
 * @param {string} filePath - Chemin complet du fichier
 * @param {string} type - Type de fichier (video, image, audio)
 * @returns {Promise<Object>} Métadonnées du fichier
 */
export const getFileMetadata = async (filePath, type) => {
  try {
    // Métadonnées de base
    const metadata = {
      filename: path.basename(filePath),
      extension: path.extname(filePath).toLowerCase(),
      mimetype: getMimeType(filePath),
      type
    };
    
    // Extraire des métadonnées supplémentaires en fonction du type
    if (type === 'video') {
      const videoMetadata = await getVideoMetadata(filePath);
      return { ...metadata, ...videoMetadata };
    } else if (type === 'image') {
      const imageMetadata = await getImageMetadata(filePath);
      return { ...metadata, ...imageMetadata };
    } else if (type === 'audio') {
      const audioMetadata = await getAudioMetadata(filePath);
      return { ...metadata, ...audioMetadata };
    }
    
    return metadata;
  } catch (error) {
    logger.error(`Erreur lors de l'extraction des métadonnées pour ${filePath}:`, error);
    return {
      filename: path.basename(filePath),
      extension: path.extname(filePath).toLowerCase(),
      mimetype: getMimeType(filePath),
      type
    };
  }
};

/**
 * Détermine le type MIME d'un fichier en fonction de son extension
 * @param {string} filePath - Chemin du fichier
 * @returns {string} Type MIME
 */
export const getMimeType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    // Vidéos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.flv': 'video/x-flv',
    '.wmv': 'video/x-ms-wmv',
    '.m4v': 'video/x-m4v',
    '.ts': 'video/mp2t',
    
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.avif': 'image/avif',
    '.tiff': 'image/tiff',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.m4a': 'audio/mp4',
    '.wma': 'audio/x-ms-wma'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Extrait les métadonnées d'un fichier vidéo
 * @param {string} filePath - Chemin du fichier vidéo
 * @returns {Promise<Object>} Métadonnées vidéo
 */
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Récupérer les informations du flux vidéo
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        if (!videoStream) {
          return reject(new Error('Aucun flux vidéo trouvé'));
        }
        
        // Extraire les métadonnées importantes
        const result = {
          width: videoStream.width,
          height: videoStream.height,
          duration: parseFloat(metadata.format.duration) || 0,
          bitrate: parseInt(metadata.format.bit_rate, 10) || 0,
          size: parseInt(metadata.format.size, 10) || 0,
          codec: videoStream.codec_name,
          fps: videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : null,
          rotation: videoStream.tags && videoStream.tags.rotate ? parseInt(videoStream.tags.rotate, 10) : 0,
          hasAudio: !!audioStream,
          container: metadata.format.format_name,
          created: metadata.format.tags && metadata.format.tags.creation_time 
            ? new Date(metadata.format.tags.creation_time).toISOString() 
            : null
        };
        
        // Ajouter des informations sur l'audio si présent
        if (audioStream) {
          result.audio = {
            codec: audioStream.codec_name,
            channels: audioStream.channels,
            sampleRate: parseInt(audioStream.sample_rate, 10),
            bitrate: parseInt(audioStream.bit_rate, 10) || 0
          };
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Extrait les métadonnées d'un fichier image
 * @param {string} filePath - Chemin du fichier image
 * @returns {Promise<Object>} Métadonnées image
 */
const getImageMetadata = async (filePath) => {
  try {
    // Importer sharp dynamiquement pour éviter les problèmes si l'extraction échoue
    const sharp = (await import('sharp')).default;
    
    const metadata = await sharp(filePath).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      // Exif et autres métadonnées pourraient être ajoutées ici
    };
  } catch (error) {
    logger.error(`Erreur lors de l'extraction des métadonnées image pour ${filePath}:`, error);
    return {};
  }
};

/**
 * Extrait les métadonnées d'un fichier audio
 * @param {string} filePath - Chemin du fichier audio
 * @returns {Promise<Object>} Métadonnées audio
 */
const getAudioMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Récupérer les informations du flux audio
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        
        if (!audioStream) {
          return reject(new Error('Aucun flux audio trouvé'));
        }
        
        // Extraire les métadonnées importantes
        const result = {
          duration: parseFloat(metadata.format.duration) || 0,
          bitrate: parseInt(metadata.format.bit_rate, 10) || 0,
          size: parseInt(metadata.format.size, 10) || 0,
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: parseInt(audioStream.sample_rate, 10),
          container: metadata.format.format_name
        };
        
        // Ajouter les tags si disponibles
        if (metadata.format.tags) {
          result.tags = {};
          
          const tagMapping = {
            'title': 'title',
            'artist': 'artist',
            'album': 'album',
            'album_artist': 'albumArtist',
            'genre': 'genre',
            'track': 'trackNumber',
            'date': 'year',
            'composer': 'composer'
          };
          
          for (const [key, value] of Object.entries(tagMapping)) {
            if (metadata.format.tags[key]) {
              result.tags[value] = metadata.format.tags[key];
            }
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};

export default {
  getFileType,
  getFileMetadata,
  getMimeType
};