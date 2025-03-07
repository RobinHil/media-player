// server/routes/files.routes.js
import express from 'express';
import { query, body, param } from 'express-validator';
import filesController from '../controllers/files.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import cacheMiddleware from '../middleware/cache.middleware.js';

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
 * /files/collections/{id}/items/{itemIndex}:
 *   delete:
 *     summary: Supprimer un élément d'une collection
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
 *       - in: path
 *         name: itemIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index de l'élément à supprimer
 *     responses:
 *       200:
 *         description: Élément supprimé
 *       404:
 *         description: Collection non trouvée ou élément non trouvé
 */
router.delete('/collections/:id/items/:itemIndex', [
  param('id')
    .isMongoId()
    .withMessage('ID de collection invalide'),
  param('itemIndex')
    .isInt({ min: 0 })
    .withMessage('Index d\'élément invalide'),
  validatorMiddleware
], (req, res, next) => {
  // Implémenter la suppression d'un élément d'une collection
  res.status(200).json({
    success: true,
    message: 'Élément supprimé de la collection'
  });
});

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
], (req, res, next) => {
  // Implémenter la suppression d'une collection
  res.status(200).json({
    success: true,
    message: 'Collection supprimée'
  });
});

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
    .isIn(['folder', 'collection'])
    .withMessage('Type invalide'),
  body('favorite')
    .isBoolean()
    .withMessage('La valeur favorite doit être un booléen'),
  validatorMiddleware
], filesController.toggleFavorite);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 shareLink:
 *                   type: string
 *                 password:
 *                   type: string
 *                   description: Mot de passe si demandé
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
], (req, res, next) => {
  // Implémenter le partage
  res.status(200).json({
    success: true,
    shareLink: `${req.protocol}://${req.get('host')}/share/abc123`,
    password: req.body.requirePassword ? 'motdepassegénéré' : null
  });
});

export default router;