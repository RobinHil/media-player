// server/config/config.js
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Configuration des dossiers de médias
const mediaConfig = {
  baseDir: process.env.MEDIA_DIR || join(rootDir, 'storage/media'),
  cacheDir: process.env.CACHE_DIR || join(rootDir, 'storage/cache'),
  thumbnailsDir: process.env.THUMBNAILS_DIR || join(rootDir, 'storage/thumbnails'),
  transcodedDir: process.env.TRANSCODED_DIR || join(rootDir, 'storage/transcoded'),
  tempDir: process.env.TEMP_DIR || join(rootDir, 'storage/temp'),
  // Liste des formats de fichiers supportés
  supportedVideoFormats: [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts'
  ],
  supportedImageFormats: [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.heic', '.heif', '.avif', '.tiff'
  ],
  supportedAudioFormats: [
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'
  ]
};

// Configuration du serveur
const serverConfig = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  apiPrefix: '/api',
};

// Configuration de l'authentification
const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
};

// Configuration du caching
const cacheConfig = {
  enabled: process.env.CACHE_ENABLED !== 'false',
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 heure par défaut en secondes
  redisUrl: process.env.REDIS_URL,
};

// Configuration du streaming
const streamingConfig = {
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1048576', 10), // 1MB par défaut
  maxBitrate: parseInt(process.env.MAX_BITRATE || '0', 10), // 0 = pas de limite
  hlsSegmentDuration: parseInt(process.env.HLS_SEGMENT_DURATION || '6', 10), // 6 secondes par segment
  transcodingThreads: parseInt(process.env.TRANSCODING_THREADS || '0', 10), // 0 = auto
  qualityLevels: process.env.QUALITY_LEVELS ? 
    process.env.QUALITY_LEVELS.split(',').map(level => parseInt(level.trim(), 10)) :
    [240, 360, 480, 720, 1080]
};

// Configuration des limites et de la sécurité
const securityConfig = {
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes par défaut
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // 1000 requêtes par fenêtre par défaut
    standardLimitByIp: parseInt(process.env.RATE_LIMIT_STANDARD || '3000', 10), // Limite standard par IP
    authLimitByIp: parseInt(process.env.RATE_LIMIT_AUTH || '100', 10), // Limite pour l'authentification
    apiLimitByIp: parseInt(process.env.RATE_LIMIT_API || '1500', 10), // Limite pour l'API
    mediaLimitByIp: parseInt(process.env.RATE_LIMIT_MEDIA || '2000', 10), // Limite pour les médias
  }
};

// Configuration des logs
const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  filename: process.env.LOG_FILE || join(rootDir, 'logs/app.log'),
};

// Configuration de la base de données
const databaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/media-streaming',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

export default {
  media: mediaConfig,
  server: serverConfig,
  auth: authConfig,
  cache: cacheConfig,
  streaming: streamingConfig,
  security: securityConfig,
  log: logConfig,
  database: databaseConfig,
  rootDir
};