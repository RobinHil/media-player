// server/routes/shared.routes.js
import express from 'express';
import { param, body, query } from 'express-validator';
import sharedController from '../controllers/shared.controller.js';
import { optionalAuthMiddleware, shareAuthMiddleware } from '../middleware/auth.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import cacheMiddleware from '../middleware/cache.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /shared/{token}:
 *   get:
 *     summary: Récupérer les informations sur un contenu partagé
 *     tags: [Shared]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de partage
 *     responses:
 *       200:
 *         description: Informations sur le contenu partagé
 *       404:
 *         description: Contenu partagé non trouvé ou expiré
 */
router.get('/:token', [
  param('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  validatorMiddleware,
  optionalAuthMiddleware,
  cacheMiddleware(300) // Cache de 5 minutes
], sharedController.getSharedInfo);

/**
 * @swagger
 * /shared/{token}/access:
 *   post:
 *     summary: Accéder à un contenu partagé protégé par mot de passe
 *     tags: [Shared]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de partage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Accès accordé
 *       401:
 *         description: Mot de passe incorrect
 *       404:
 *         description: Contenu partagé non trouvé ou expiré
 */
router.post('/:token/access', [
  param('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  validatorMiddleware,
  optionalAuthMiddleware
], sharedController.accessSharedContent);

/**
 * @swagger
 * /shared/stream/{token}:
 *   get:
 *     summary: Diffuser un contenu partagé en streaming
 *     tags: [Shared]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de partage
 *       - in: query
 *         name: accessToken
 *         schema:
 *           type: string
 *         description: Token d'accès (si protégé par mot de passe)
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [auto, 240p, 360p, 480p, 720p, 1080p]
 *         description: Qualité vidéo (optionnel)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [auto, mp4, webm, hls]
 *         description: Format vidéo (optionnel)
 *     responses:
 *       200:
 *         description: Fichier streamé
 *       401:
 *         description: Accès non autorisé
 *       404:
 *         description: Contenu partagé non trouvé ou expiré
 */
router.get('/stream/:token', [
  param('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  query('accessToken')
    .optional(),
  query('quality')
    .optional()
    .isIn(['auto', '240p', '360p', '480p', '720p', '1080p'])
    .withMessage('Qualité invalide'),
  query('format')
    .optional()
    .isIn(['auto', 'mp4', 'webm', 'hls'])
    .withMessage('Format invalide'),
  validatorMiddleware,
  shareAuthMiddleware
], sharedController.streamSharedMedia);

/**
 * @swagger
 * /shared/thumbnail/{token}:
 *   get:
 *     summary: Générer une miniature pour un média partagé
 *     tags: [Shared]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de partage
 *       - in: query
 *         name: accessToken
 *         schema:
 *           type: string
 *         description: Token d'accès (si protégé par mot de passe)
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *         description: Largeur en pixels (optionnel)
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *         description: Hauteur en pixels (optionnel)
 *       - in: query
 *         name: time
 *         schema:
 *           type: integer
 *         description: Position temporelle pour les vidéos en secondes (optionnel)
 *     responses:
 *       200:
 *         description: Miniature générée
 *       401:
 *         description: Accès non autorisé
 *       404:
 *         description: Contenu partagé non trouvé ou expiré
 */
router.get('/thumbnail/:token', [
  param('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  query('accessToken')
    .optional(),
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
  validatorMiddleware,
  shareAuthMiddleware,
  cacheMiddleware(86400) // Cache d'un jour
], sharedController.getThumbnailShared);

/**
 * @swagger
 * /shared/download/{token}:
 *   get:
 *     summary: Télécharger un fichier partagé
 *     tags: [Shared]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de partage
 *       - in: query
 *         name: accessToken
 *         schema:
 *           type: string
 *         description: Token d'accès (si protégé par mot de passe)
 *     responses:
 *       200:
 *         description: Fichier à télécharger
 *       401:
 *         description: Accès non autorisé
 *       404:
 *         description: Contenu partagé non trouvé ou expiré
 */
router.get('/download/:token', [
  param('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  query('accessToken')
    .optional(),
  validatorMiddleware,
  shareAuthMiddleware
], sharedController.downloadSharedFile);

export default router;