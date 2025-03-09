// server/routes/user.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import userController from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware, { editorMiddleware } from '../middleware/admin.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import config from '../config/config.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non authentifié
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Mettre à jour le profil de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', [
  body('name')
    .optional()
    .isString()
    .withMessage('Le nom doit être une chaîne de caractères')
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  validatorMiddleware
], userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Changer le mot de passe de l'utilisateur
 *     tags: [Users]
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Mot de passe changé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Mot de passe actuel incorrect
 */
router.post('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: config.security.passwordMinLength })
    .withMessage(`Le nouveau mot de passe doit contenir au moins ${config.security.passwordMinLength} caractères`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  validatorMiddleware
], userController.changePassword);

/**
 * @swagger
 * /users/preferences:
 *   get:
 *     summary: Récupérer les préférences utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Préférences utilisateur
 *       401:
 *         description: Non authentifié
 */
router.get('/preferences', userController.getPreferences);

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Mettre à jour les préférences utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *               defaultView:
 *                 type: string
 *                 enum: [grid, list]
 *               itemsPerPage:
 *                 type: integer
 *               autoplay:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Préférences mises à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/preferences', [
  body('language')
    .optional()
    .isString()
    .withMessage('La langue doit être une chaîne de caractères'),
  body('defaultView')
    .optional()
    .isIn(['grid', 'list'])
    .withMessage('Vue par défaut invalide'),
  body('itemsPerPage')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Le nombre d\'éléments par page doit être entre 10 et 100'),
  body('autoplay')
    .optional()
    .isBoolean()
    .withMessage('La valeur autoplay doit être un booléen'),
  validatorMiddleware
], userController.updatePreferences);

/**
 * @swagger
 * /users/sessions:
 *   get:
 *     summary: Récupérer les sessions actives de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sessions actives
 *       401:
 *         description: Non authentifié
 */
router.get('/sessions', userController.getSessions);

/**
 * @swagger
 * /users/sessions/{id}:
 *   delete:
 *     summary: Révoquer une session spécifique
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session révoquée
 *       403:
 *         description: Session non autorisée
 *       404:
 *         description: Session non trouvée
 */
router.delete('/sessions/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID de session invalide'),
  validatorMiddleware
], userController.revokeSession);

/**
 * @swagger
 * /users/sessions:
 *   delete:
 *     summary: Révoquer toutes les sessions sauf la session courante
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sessions révoquées
 *       401:
 *         description: Non authentifié
 */
router.delete('/sessions', userController.revokeAllSessions);

// Routes administratives (nécessitent des privilèges d'admin)
router.use(adminMiddleware);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs (admin seulement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       403:
 *         description: Accès refusé
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID (admin seulement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID d\'utilisateur invalide'),
  validatorMiddleware
], userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur (admin seulement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, editor, admin]
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID d\'utilisateur invalide'),
  body('name')
    .optional()
    .isString()
    .withMessage('Le nom doit être une chaîne de caractères')
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['user', 'editor', 'admin'])
    .withMessage('Rôle invalide'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Le statut actif doit être un booléen'),
  validatorMiddleware
], userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin seulement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: deleteData
 *         schema:
 *           type: boolean
 *         description: Supprimer également les données (true/false)
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', [
  param('id')
    .isMongoId()
    .withMessage('ID d\'utilisateur invalide'),
  query('deleteData')
    .optional()
    .isBoolean()
    .withMessage('La valeur deleteData doit être un booléen'),
  validatorMiddleware
], userController.deleteUser);

export default router;