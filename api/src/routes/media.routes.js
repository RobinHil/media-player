// server/routes/media.routes.js
import express from 'express';
import { param, query } from 'express-validator';
import mediaController from '../controllers/media.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { optionalAuthMiddleware, shareAuthMiddleware } from '../middleware/auth.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import cacheMiddleware from '../middleware/cache.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /media/stream/{path}:
 *   get:
 *     summary: Streamer un fichier média
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [auto, 240p, 360p, 480p, 720p, 1080p, original]
 *         description: Qualité de la vidéo (pour les vidéos uniquement)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [auto, mp4, webm, hls]
 *         description: Format de sortie (pour les vidéos uniquement)
 *     responses:
 *       200:
 *         description: Fichier streamé
 *         content:
 *           video/*: {}
 *           image/*: {}
 *           audio/*: {}
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/stream/:path(*)', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  query('quality')
    .optional()
    .isIn(['auto', '240p', '360p', '480p', '720p', '1080p', 'original'])
    .withMessage('Qualité invalide'),
  query('format')
    .optional()
    .isIn(['auto', 'mp4', 'webm', 'hls'])
    .withMessage('Format invalide'),
  validatorMiddleware
], mediaController.streamMedia);

/**
 * @swagger
 * /media/thumbnail/{path}:
 *   get:
 *     summary: Obtenir la miniature d'un fichier média
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *         description: Largeur souhaitée
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *         description: Hauteur souhaitée
 *       - in: query
 *         name: time
 *         schema:
 *           type: integer
 *         description: Position temporelle pour les vidéos (en secondes)
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Forcer la régénération de la miniature
 *     responses:
 *       200:
 *         description: Miniature
 *         content:
 *           image/jpeg: {}
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/thumbnail/:path(*)', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  query('width')
    .optional()
    .isInt({ min: 16, max: 1920 })
    .withMessage('Largeur invalide'),
  query('height')
    .optional()
    .isInt({ min: 16, max: 1080 })
    .withMessage('Hauteur invalide'),
  query('time')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position temporelle invalide'),
  query('refresh')
    .optional()
    .isBoolean()
    .withMessage('La valeur refresh doit être un booléen'),
  validatorMiddleware,
  cacheMiddleware(86400) // Cache d'un jour
], mediaController.getThumbnail);

/**
 * @swagger
 * /media/info/{path}:
 *   get:
 *     summary: Obtenir les informations détaillées sur un fichier média
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier
 *     responses:
 *       200:
 *         description: Informations sur le fichier
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/info/:path(*)', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  validatorMiddleware,
  cacheMiddleware(3600) // Cache d'une heure
], mediaController.getMediaInfo);

/**
 * @swagger
 * /media/formats/{path}:
 *   get:
 *     summary: Obtenir les formats disponibles pour un fichier vidéo
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier vidéo
 *     responses:
 *       200:
 *         description: Formats disponibles
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/formats/:path(*)', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  validatorMiddleware,
  cacheMiddleware(3600) // Cache d'une heure
], mediaController.getAvailableFormats);

/**
 * @swagger
 * /media/subtitles/{path}:
 *   get:
 *     summary: Obtenir les sous-titres disponibles pour un fichier vidéo
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier vidéo
 *     responses:
 *       200:
 *         description: Sous-titres disponibles
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/subtitles/:path(*)', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  validatorMiddleware,
  cacheMiddleware(3600) // Cache d'une heure
], mediaController.getSubtitles);

/**
 * @swagger
 * /media/subtitle/{path}/{lang}:
 *   get:
 *     summary: Obtenir un fichier de sous-titres spécifique
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Chemin relatif du fichier vidéo
 *       - in: path
 *         name: lang
 *         required: true
 *         schema:
 *           type: string
 *         description: Code de langue (fr, en, etc.)
 *     responses:
 *       200:
 *         description: Fichier de sous-titres
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/subtitle/:path(*)/:lang', [
  param('path')
    .notEmpty()
    .withMessage('Le chemin est requis'),
  param('lang')
    .isLength({ min: 2, max: 5 })
    .withMessage('Code de langue invalide'),
  validatorMiddleware,
  cacheMiddleware(86400) // Cache d'un jour
], mediaController.getSubtitleFile);

/**
 * @swagger
 * /media/hls/{id}/{file}:
 *   get:
 *     summary: Accéder aux segments HLS
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du stream HLS
 *       - in: path
 *         name: file
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du fichier (manifest.m3u8 ou segment)
 *     responses:
 *       200:
 *         description: Fichier HLS
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Fichier non trouvé
 */
router.get('/hls/:id/:file', [
  param('id')
    .notEmpty()
    .withMessage('L\'identifiant est requis'),
  param('file')
    .notEmpty()
    .withMessage('Le nom du fichier est requis'),
  validatorMiddleware,
  cacheMiddleware(3600) // Cache d'une heure
], mediaController.getHlsSegment);

export default router;