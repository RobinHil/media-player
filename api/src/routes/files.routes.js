// server/routes/files.routes.js
import express from 'express';
import { query, body, param } from 'express-validator';
import filesController from '../controllers/files.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import cacheMiddleware from '../middleware/cache.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Récupérer la liste des fichiers et dossiers
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: Chemin relatif du dossier (vide pour racine)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, video, image, audio]
 *         description: Filtrer par type de fichier
 *     responses:
 *       200:
 *         description: Liste des fichiers et dossiers
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Dossier non trouvé
 */
router.get('/', [
  query('path')
    .optional()
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  query('type')
    .optional()
    .isIn(['all', 'video', 'image', 'audio'])
    .withMessage('Type invalide'),
  validatorMiddleware,
  cacheMiddleware(300) // Cache de 5 minutes
], filesController.getFiles);

/**
 * @swagger
 * /files/search:
 *   get:
 *     summary: Rechercher des fichiers
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, video, image, audio]
 *         description: Filtrer par type de fichier
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 */
router.get('/search', [
  query('query')
    .notEmpty()
    .withMessage('Le terme de recherche est requis')
    .isString()
    .withMessage('Le terme de recherche doit être une chaîne de caractères'),
  query('type')
    .optional()
    .isIn(['all', 'video', 'image', 'audio'])
    .withMessage('Type invalide'),
  validatorMiddleware
], filesController.searchFiles);

/**
 * @swagger
 * /files/recent:
 *   get:
 *     summary: Récupérer les fichiers récemment consultés
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre maximum de fichiers
 *     responses:
 *       200:
 *         description: Liste des fichiers récemment consultés
 */
router.get('/recent', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un nombre entier entre 1 et 100'),
  validatorMiddleware
], filesController.getRecentFiles);

/**
 * @swagger
 * /files/collections:
 *   get:
 *     summary: Récupérer les collections de l'utilisateur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des collections
 */
router.get('/collections', filesController.getCollections);

/**
 * @swagger
 * /files/collections:
 *   post:
 *     summary: Créer une nouvelle collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Collection créée
 */
router.post('/collections', [
  body('name')
    .notEmpty()
    .withMessage('Le nom est requis')
    .isString()
    .withMessage('Le nom doit être une chaîne de caractères')
    .isLength({ min: 1, max: 100 })
    .withMessage('Le nom doit contenir entre 1 et 100 caractères'),
  body('description')
    .optional()
    .isString()
    .withMessage('La description doit être une chaîne de caractères'),
  validatorMiddleware
], filesController.createCollection);

/**
 * @swagger
 * /files/collections/{id}:
 *   get:
 *     summary: Récupérer les détails d'une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     responses:
 *       200:
 *         description: Détails de la collection
 *       404:
 *         description: Collection non trouvée
 */
router.get('/collections/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  validatorMiddleware
], filesController.getCollection);

/**
 * @swagger
 * /files/collections/{id}/items:
 *   get:
 *     summary: Récupérer les éléments d'une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     responses:
 *       200:
 *         description: Éléments de la collection
 *       404:
 *         description: Collection non trouvée
 */
router.get('/collections/:id/items', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  validatorMiddleware
], filesController.getCollectionItems);

/**
 * @swagger
 * /files/collections/{id}/items:
 *   post:
 *     summary: Ajouter un élément à une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Élément ajouté
 *       404:
 *         description: Collection non trouvée
 */
router.post('/collections/:id/items', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  body('path')
    .notEmpty()
    .withMessage('Le chemin est requis')
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  validatorMiddleware
], filesController.addToCollection);

/**
 * @swagger
 * /files/collections/{id}/items:
 *   delete:
 *     summary: Retire un élément d'une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Élément retiré de la collection
 *       404:
 *         description: Collection non trouvée
 */
router.delete('/collections/:id/items', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  body('path')
    .notEmpty()
    .withMessage('Le chemin est requis')
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  validatorMiddleware
], filesController.removeFromCollection);

/**
 * @swagger
 * /files/collections/{id}:
 *   delete:
 *     summary: Supprimer une collection
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la collection
 *     responses:
 *       200:
 *         description: Collection supprimée
 *       404:
 *         description: Collection non trouvée
 */
router.delete('/collections/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  validatorMiddleware
], filesController.deleteCollection);

/**
 * @swagger
 * /files/favorites:
 *   get:
 *     summary: Récupérer les favoris de l'utilisateur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des favoris
 */
router.get('/favorites', filesController.getFavorites);

/**
 * @swagger
 * /files/favorites:
 *   post:
 *     summary: Ajouter ou retirer un élément des favoris
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *               - type
 *               - favorite
 *             properties:
 *               path:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [folder, collection]
 *               favorite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Favoris mis à jour
 */
router.post('/favorites', [
  body('path')
    .notEmpty()
    .withMessage('Le chemin est requis')
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  body('type')
    .isIn(['folder', 'collection', 'file'])
    .withMessage('Type invalide'),
  body('favorite')
    .isBoolean()
    .withMessage('La valeur favorite doit être un booléen'),
  validatorMiddleware
], filesController.toggleFavorite);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Télécharger un fichier sur le serveur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         description: Chemin de destination
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Fichier téléchargé avec succès
 *       400:
 *         description: Erreur de validation
 *       413:
 *         description: Fichier trop volumineux
 */
router.post('/upload', [
  query('path')
    .optional()
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  uploadMiddleware.single('file'),
  validatorMiddleware
], filesController.uploadFile);

/**
 * @swagger
 * /files/share:
 *   post:
 *     summary: Partager un fichier ou un dossier
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *               expiresIn:
 *                 type: string
 *                 description: Durée de validité (1d, 7d, 30d, etc.)
 *               requirePassword:
 *                 type: boolean
 *               maxAccesses:
 *                 type: integer
 *               requireAccount:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lien de partage créé
 */
router.post('/share', [
  body('path')
    .notEmpty()
    .withMessage('Le chemin est requis')
    .isString()
    .withMessage('Le chemin doit être une chaîne de caractères'),
  body('expiresIn')
    .optional()
    .matches(/^\d+[dhm]$/)
    .withMessage('Format de durée invalide (exemples: 1d, 7d, 12h, 30m)'),
  body('requirePassword')
    .optional()
    .isBoolean()
    .withMessage('La valeur requirePassword doit être un booléen'),
  body('maxAccesses')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La valeur maxAccesses doit être un entier positif'),
  body('requireAccount')
    .optional()
    .isBoolean()
    .withMessage('La valeur requireAccount doit être un booléen'),
  validatorMiddleware
], filesController.shareMedia);

/**
 * @swagger
 * /files/shared:
 *   get:
 *     summary: Récupérer les éléments partagés par l'utilisateur
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des éléments partagés
 */
router.get('/shared', filesController.getSharedItems);

/**
 * @swagger
 * /files/share/{shareId}:
 *   delete:
 *     summary: Supprimer un partage
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du partage
 *     responses:
 *       200:
 *         description: Partage supprimé
 *       404:
 *         description: Partage non trouvé
 */
router.delete('/share/:shareId', [
  param('shareId')
    .isString()
    .withMessage('ID de partage invalide'),
  validatorMiddleware
], filesController.deleteShare);

export default router;