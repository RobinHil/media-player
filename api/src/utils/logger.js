// server/utils/logger.js
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/config.js';

// Obtenir le chemin absolu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier de logs s'il n'existe pas
const logDir = path.dirname(config.log.filename);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formatage des logs pour la console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ level, message, timestamp, ...meta }) => `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
  )
);

// Formatage des logs pour les fichiers
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Créer les transports
const transports = [
  // Logs dans la console
  new winston.transports.Console({
    level: config.server.env === 'production' ? 'info' : 'debug',
    format: consoleFormat,
  }),
  
  // Logs dans un fichier
  new winston.transports.File({
    filename: config.log.filename,
    level: config.log.level,
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  
  // Logs d'erreur dans un fichier séparé
  new winston.transports.File({
    filename: path.join(path.dirname(config.log.filename), 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
];

// Créer le logger
const logger = winston.createLogger({
  level: config.server.env === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'media-api' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(path.dirname(config.log.filename), 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(path.dirname(config.log.filename), 'rejections.log'),
      format: fileFormat,
    }),
  ],
  exitOnError: false, // Ne pas quitter sur les erreurs non gérées
});

// En développement, afficher les requêtes HTTP reçues
if (config.server.env === 'development') {
  logger.info('Logger initialiser au niveau', config.log.level);
}

export default logger;