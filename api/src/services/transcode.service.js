// server/services/transcode.service.js
import path from 'path';
import { promises as fs, createReadStream, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
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
    mkdirSync(config.media.transcodedDir, { recursive: true });
    mkdirSync(config.media.cacheDir, { recursive: true });
    mkdirSync(path.join(config.media.transcodedDir, 'hls'), { recursive: true });
    
    logger.info('Dossiers de transcodage créés avec succès');
  } catch (error) {
    logger.error('Erreur lors de la création des dossiers de transcodage:', error);
  }
};

// Initialiser les dossiers au démarrage
ensureDirectories();

/**
 * Vérifie si un fichier doit être transcodé en fonction du format demandé
 * @param {string} filePath - Chemin du fichier original
 * @param {string} format - Format de sortie demandé (auto, mp4, webm)
 * @returns {Promise<boolean>} True si le transcodage est nécessaire
 */
const needsTranscoding = async (filePath, format) => {
  try {
    const extension = path.extname(filePath).toLowerCase();
    
    // Si le format est 'auto', vérifier si l'extension est déjà compatible
    if (format === 'auto') {
      // Extensions compatibles avec le web sans transcodage
      const webCompatible = ['.mp4', '.webm', '.ogg', '.mov'];
      return !webCompatible.includes(extension);
    }
    
    // Si un format spécifique est demandé, vérifier s'il correspond à l'extension
    if (format === 'mp4' && extension === '.mp4') return false;
    if (format === 'webm' && extension === '.webm') return false;
    
    // Dans tous les autres cas, le transcodage est nécessaire
    return true;
  } catch (error) {
    logger.error('Erreur lors de la vérification de la nécessité du transcodage:', error);
    // En cas d'erreur, on suppose que le transcodage est nécessaire par précaution
    return true;
  }
};

/**
 * Détermine les formats disponibles pour une vidéo
 * @param {string} mediaPath - Chemin relatif du fichier
 * @returns {Promise<Array>} Liste des formats disponibles
 */
const getAvailableFormats = async (mediaPath) => {
  try {
    const fullPath = path.join(config.media.baseDir, mediaPath);
    
    // Vérifier si le fichier existe
    await fs.access(fullPath);
    
    // Obtenir les métadonnées avec ffprobe
    const metadata = await getVideoMetadata(fullPath);
    
    // Construire les formats disponibles en fonction des capacités du serveur
    const formats = [
      {
        format: 'mp4',
        qualities: buildQualities(metadata, 'mp4')
      },
      {
        format: 'webm',
        qualities: buildQualities(metadata, 'webm')
      },
      {
        format: 'hls',
        qualities: buildQualities(metadata, 'hls')
      }
    ];
    
    return formats;
  } catch (error) {
    logger.error('Erreur lors de la récupération des formats disponibles:', error);
    return [];
  }
};

/**
 * Construit la liste des qualités disponibles pour un format
 * @param {Object} metadata - Métadonnées de la vidéo
 * @param {string} format - Format de sortie
 * @returns {Array} Liste des qualités disponibles
 */
const buildQualities = (metadata, format) => {
  try {
    const originalWidth = metadata.width || 1920;
    const originalHeight = metadata.height || 1080;
    const originalBitrate = metadata.bitrate || 5000000; // 5 Mbps par défaut
    
    // Liste des qualités possibles
    const possibleQualities = config.streaming.qualityLevels;
    
    // Construire la liste des qualités disponibles
    const qualities = possibleQualities
      .filter(height => height <= originalHeight)
      .map(height => {
        // Calculer la largeur proportionnelle
        const width = Math.floor((height / originalHeight) * originalWidth);
        
        // Calculer le bitrate proportionnel (approximatif)
        const bitrate = Math.floor((height / originalHeight) * originalBitrate);
        
        return {
          quality: `${height}p`,
          width,
          height,
          bitrate
        };
      });
    
    // Ajouter la qualité originale si elle n'est pas déjà incluse
    const hasOriginal = qualities.some(q => q.height === originalHeight);
    
    if (!hasOriginal) {
      qualities.push({
        quality: 'original',
        width: originalWidth,
        height: originalHeight,
        bitrate: originalBitrate
      });
    }
    
    // Trier par hauteur (qualité) croissante
    return qualities.sort((a, b) => a.height - b.height);
  } catch (error) {
    logger.error('Erreur lors de la construction des qualités:', error);
    return [];
  }
};

/**
 * Récupère les métadonnées d'une vidéo avec ffprobe
 * @param {string} filePath - Chemin complet de la vidéo
 * @returns {Promise<Object>} Métadonnées de la vidéo
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
        
        if (!videoStream) {
          return reject(new Error('Aucun flux vidéo trouvé'));
        }
        
        // Construire l'objet de métadonnées
        const result = {
          width: videoStream.width,
          height: videoStream.height,
          duration: parseFloat(metadata.format.duration) || 0,
          bitrate: parseInt(metadata.format.bit_rate, 10) || 0,
          codec: videoStream.codec_name,
          fps: eval(videoStream.r_frame_rate) || 0
        };
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Streame une version transcodée d'un fichier vidéo
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin complet du fichier original
 * @param {string} relativePath - Chemin relatif du fichier
 * @param {string} quality - Qualité demandée
 * @param {string} format - Format demandé
 */
const streamTranscoded = async (req, res, filePath, relativePath, quality, format) => {
  try {
    // Déterminer le format de sortie si 'auto'
    if (format === 'auto') {
      format = 'mp4'; // Par défaut
      
      // Détecter le format préféré en fonction du navigateur
      const userAgent = req.headers['user-agent'] || '';
      if (userAgent.includes('Firefox') || userAgent.includes('Chrome')) {
        format = 'webm';
      }
    }
    
    // Construire le chemin du fichier transcodé
    const fileBaseName = path.basename(filePath, path.extname(filePath));
    const qualitySuffix = quality !== 'auto' ? `-${quality}` : '';
    const transcodedFileName = `${fileBaseName}${qualitySuffix}.${format}`;
    const transcodedFilePath = path.join(config.media.transcodedDir, transcodedFileName);
    
    // Vérifier si le fichier transcodé existe déjà
    const fileExists = existsSync(transcodedFilePath);
    
    if (fileExists) {
      // Le fichier existe, le streamer directement
      logger.info(`Streaming du fichier transcodé existant: ${transcodedFilePath}`);
      
      // Déterminer le type MIME
      const contentType = format === 'mp4' ? 'video/mp4' : 
                        format === 'webm' ? 'video/webm' : 
                        'video/mp4';
      
      // Streamer le fichier avec support des plages
      return streamWithRangeSupport(req, res, transcodedFilePath, contentType);
    }
    
    // Le fichier n'existe pas encore, vérifier si le transcodage est en cours
    const transcodingKey = `transcoding:${relativePath}:${quality}:${format}`;
    const isTranscoding = await cacheService.get(transcodingKey);
    
    if (isTranscoding) {
      // Le transcodage est en cours, informer le client
      return res.status(202).json({
        success: true,
        status: 'transcoding',
        message: 'Transcodage en cours, veuillez réessayer plus tard'
      });
    }
    
    // Lancer le transcodage en arrière-plan
    await cacheService.set(transcodingKey, true, 3600); // TTL d'une heure
    
    // Informer le client que le transcodage a commencé
    res.status(202).json({
      success: true,
      status: 'started',
      message: 'Transcodage démarré, veuillez réessayer plus tard'
    });
    
    // Lancer le transcodage en arrière-plan
    transcodeVideo(filePath, transcodedFilePath, quality, format)
      .then(() => {
        logger.info(`Transcodage terminé pour ${filePath}`);
        cacheService.del(transcodingKey);
      })
      .catch(error => {
        logger.error(`Erreur lors du transcodage de ${filePath}:`, error);
        cacheService.del(transcodingKey);
      });
  } catch (error) {
    logger.error('Erreur lors du streaming transcodé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming transcodé'
    });
  }
};

/**
 * Transcode une vidéo vers un format et une qualité spécifiques
 * @param {string} inputPath - Chemin du fichier original
 * @param {string} outputPath - Chemin du fichier de sortie
 * @param {string} quality - Qualité demandée
 * @param {string} format - Format de sortie
 * @returns {Promise} Promise résolue une fois le transcodage terminé
 */
const transcodeVideo = (inputPath, outputPath, quality, format) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtenir les métadonnées de la vidéo
      const metadata = await getVideoMetadata(inputPath);
      
      // Configuration de base de FFmpeg
      let command = ffmpeg(inputPath);
      
      // Configurer la qualité
      if (quality !== 'auto' && quality !== 'original') {
        const height = parseInt(quality.replace('p', ''), 10);
        const width = Math.floor((height / metadata.height) * metadata.width);
        
        command = command.size(`${width}x${height}`);
      }
      
      // Configurer le format de sortie
      if (format === 'mp4') {
        command = command
          .format('mp4')
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-movflags +faststart',
            '-pix_fmt yuv420p',
            '-profile:v baseline',
            '-level 3.0'
          ]);
      } else if (format === 'webm') {
        command = command
          .format('webm')
          .videoCodec('libvpx')
          .audioCodec('libvorbis')
          .outputOptions([
            '-quality good',
            '-cpu-used 0',
            '-qmin 10',
            '-qmax 42'
          ]);
      }
      
      // Événements
      command
        .on('start', (commandLine) => {
          logger.info(`Démarrage du transcodage: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Progression: ${progress.percent}% terminé`);
        })
        .on('end', () => {
          logger.info(`Transcodage terminé: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`Erreur de transcodage: ${err.message}`);
          reject(err);
        });
      
      // Lancer le transcodage
      command.save(outputPath);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Prépare un stream HLS pour une vidéo
 * @param {string} filePath - Chemin complet du fichier original
 * @param {string} relativePath - Chemin relatif du fichier
 * @param {string} quality - Qualité demandée
 * @returns {Promise<Object>} Informations sur le stream HLS
 */
const prepareHLS = async (filePath, relativePath, quality) => {
  try {
    // Créer un identifiant unique pour cette vidéo
    const fileBaseName = path.basename(filePath, path.extname(filePath));
    const hlsDir = path.join(config.media.transcodedDir, 'hls', fileBaseName);
    
    // Créer le dossier pour les segments HLS
    mkdirSync(hlsDir, { recursive: true });
    
    // Chemin du manifeste HLS
    const manifestPath = path.join(hlsDir, 'playlist.m3u8');
    
    // Vérifier si le manifeste existe déjà
    const manifestExists = existsSync(manifestPath);
    
    if (manifestExists) {
      // Le stream HLS est déjà prêt
      return {
        status: 'ready',
        manifestUrl: `/api/media/hls/${fileBaseName}/playlist.m3u8`
      };
    }
    
    // Vérifier si la préparation est en cours
    const hlsKey = `hls:${relativePath}`;
    const isPreparingHLS = await cacheService.get(hlsKey);
    
    if (isPreparingHLS) {
      // La préparation est en cours
      return {
        status: 'preparing',
        eta: 60 // ETA approximatif de 60 secondes
      };
    }
    
    // Lancer la préparation HLS en arrière-plan
    await cacheService.set(hlsKey, true, 3600); // TTL d'une heure
    
    prepareHLSSegments(filePath, hlsDir, quality)
      .then(() => {
        logger.info(`Préparation HLS terminée pour ${filePath}`);
        cacheService.del(hlsKey);
      })
      .catch(error => {
        logger.error(`Erreur lors de la préparation HLS pour ${filePath}:`, error);
        cacheService.del(hlsKey);
      });
    
    // Indiquer que la préparation a commencé
    return {
      status: 'preparing',
      eta: 120 // ETA approximatif de 2 minutes
    };
  } catch (error) {
    logger.error('Erreur lors de la préparation HLS:', error);
    throw error;
  }
};

/**
 * Prépare les segments HLS pour une vidéo
 * @param {string} inputPath - Chemin du fichier original
 * @param {string} outputDir - Dossier de sortie pour les segments
 * @param {string} quality - Qualité demandée
 * @returns {Promise} Promise résolue une fois la préparation terminée
 */
const prepareHLSSegments = (inputPath, outputDir, quality) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtenir les métadonnées de la vidéo
      const metadata = await getVideoMetadata(inputPath);
      
      // Configuration de base de FFmpeg
      let command = ffmpeg(inputPath);
      
      // Durée des segments (en secondes)
      const segmentDuration = config.streaming.hlsSegmentDuration || 6;
      
      // Configurer les différentes qualités
      if (quality === 'auto' || quality === 'adaptive') {
        // Créer une version adaptative avec plusieurs qualités
        const qualities = [
          { height: 240, bitrate: '400k' },
          { height: 360, bitrate: '800k' },
          { height: 480, bitrate: '1500k' },
          { height: 720, bitrate: '3000k' }
        ];
        
        // Ne conserver que les qualités inférieures ou égales à la résolution d'origine
        const filteredQualities = qualities.filter(q => q.height <= metadata.height);
        
        // Ajouter une variante pour chaque qualité
        for (const q of filteredQualities) {
          command = command.outputOptions([
            `-map 0:v`,
            `-map 0:a`,
            `-c:a aac`,
            `-ar 48000`,
            `-c:v libx264`,
            `-profile:v main`,
            `-crf 20`,
            `-sc_threshold 0`,
            `-g ${segmentDuration * 2}`,
            `-keyint_min ${segmentDuration * 2}`,
            `-hls_time ${segmentDuration}`,
            `-hls_playlist_type vod`,
            `-b:v ${q.bitrate}`,
            `-maxrate ${q.bitrate}`,
            `-bufsize ${q.bitrate}`,
            `-vf scale=-2:${q.height}`,
            `-hls_segment_filename ${path.join(outputDir, `${q.height}p_%03d.ts`)}`,
            `-var_stream_map "v:0,a:0"`,
            `-master_pl_name master.m3u8`,
            `-f hls`
          ]);
          
          // Ajouter le fichier de sortie
          command = command.output(path.join(outputDir, `${q.height}p.m3u8`));
        }
      } else {
        // Créer une version à une seule qualité
        const height = quality !== 'original' ? parseInt(quality.replace('p', ''), 10) : metadata.height;
        const width = Math.floor((height / metadata.height) * metadata.width);
        
        command = command
          .outputOptions([
            `-c:a aac`,
            `-ar 48000`,
            `-c:v libx264`,
            `-profile:v main`,
            `-crf 20`,
            `-g ${segmentDuration * 2}`,
            `-keyint_min ${segmentDuration * 2}`,
            `-hls_time ${segmentDuration}`,
            `-hls_playlist_type vod`,
            `-hls_segment_filename ${path.join(outputDir, 'segment_%03d.ts')}`
          ]);
        
        // Ajouter le redimensionnement si nécessaire
        if (height !== metadata.height) {
          command = command.outputOptions([
            `-vf scale=${width}:${height}`
          ]);
        }
        
        // Ajouter le fichier de sortie
        command = command.output(path.join(outputDir, 'playlist.m3u8'));
      }
      
      // Événements
      command
        .on('start', (commandLine) => {
          logger.info(`Démarrage de la préparation HLS: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Progression HLS: ${progress.percent}% terminé`);
        })
        .on('end', () => {
          logger.info(`Préparation HLS terminée: ${outputDir}`);
          resolve(outputDir);
        })
        .on('error', (err) => {
          logger.error(`Erreur de préparation HLS: ${err.message}`);
          reject(err);
        });
      
      // Lancer la préparation
      command.run();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Streame un fichier avec support des plages (HTTP Range Requests)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} filePath - Chemin du fichier à streamer
 * @param {string} contentType - Type MIME du contenu
 */
const streamWithRangeSupport = async (req, res, filePath, contentType) => {
  try {
    // Obtenir les statistiques du fichier
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    
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
    logger.error('Erreur lors du streaming avec support des plages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du streaming du fichier'
    });
  }
};

export default {
  needsTranscoding,
  getAvailableFormats,
  streamTranscoded,
  prepareHLS,
  getVideoMetadata
};