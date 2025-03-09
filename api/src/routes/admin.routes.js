// server/routes/admin.routes.js
import express from 'express';
import { body, query } from 'express-validator';
import adminController from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';
import validatorMiddleware from '../middleware/validator.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification et des privilèges admin
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Récupérer les journaux d'activité (admin uniquement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'entrées par page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type d'activité (login, upload, etc.)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtre par utilisateur
 *     responses:
 *       200:
 *         description: Journaux d'activité
 *       403:
 *         description: Accès refusé
 */
router.get('/logs', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier entre 1 et 100'),
  query('type')
    .optional()
    .isString()
    .withMessage('Le type doit être une chaîne de caractères'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('ID d\'utilisateur invalide'),
  validatorMiddleware
], adminController.getLogs);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Récupérer les statistiques globales (admin uniquement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistiques globales
 *       403:
 *         description: Accès refusé
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Récupérer les paramètres globaux (admin uniquement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paramètres globaux
 *       403:
 *         description: Accès refusé
 */
router.get('/settings', adminController.getSettings);

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: Mettre à jour les paramètres globaux (admin uniquement)
 *     tags: [Admin]
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
 *               registration:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   requireApproval:
 *                     type: boolean
 *               storage:
 *                 type: object
 *                 properties:
 *                   defaultLimit:
 *                     type: integer
 *               security:
 *                 type: object
 *                 properties:
 *                   maxLoginAttempts:
 *                     type: integer
 *                   lockoutTime:
 *                     type: integer
 *                   sessionTimeout:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Paramètres mis à jour
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès refusé
 */
router.put('/settings', [
  body('registration')
    .optional()
    .isObject()
    .withMessage('Les paramètres d\'inscription doivent être un objet'),
  body('registration.enabled')
    .optional()
    .isBoolean()
    .withMessage('La valeur enabled doit être un booléen'),
  body('registration.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('La valeur requireApproval doit être un booléen'),
  body('storage')
    .optional()
    .isObject()
    .withMessage('Les paramètres de stockage doivent être un objet'),
  body('storage.defaultLimit')
    .optional()
    .isInt({ min: 1024 * 1024 * 10 }) // Minimum 10MB
    .withMessage('La limite par défaut doit être au moins 10MB'),
  body('security')
    .optional()
    .isObject()
    .withMessage('Les paramètres de sécurité doivent être un objet'),
  body('security.maxLoginAttempts')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Le nombre maximum de tentatives de connexion doit être entre 1 et 20'),
  body('security.lockoutTime')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('La durée de verrouillage doit être entre 60 et 86400 secondes'),
  body('security.sessionTimeout')
    .optional()
    .isInt({ min: 300, max: 86400 })
    .withMessage('La durée d\'expiration de session doit être entre 300 et 86400 secondes'),
  validatorMiddleware
], adminController.updateSettings);

export default router;