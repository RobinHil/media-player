// server/routes/auth.routes.js
import express from 'express';
import passport from 'passport';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller.js';
import validatorMiddleware from '../middleware/validator.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import config from '../config/config.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: config.security.passwordMinLength })
    .withMessage(`Le mot de passe doit contenir au moins ${config.security.passwordMinLength} caractères`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  validatorMiddleware
], authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Échec de l'authentification
 */
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  validatorMiddleware
], authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion d'un utilisateur
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Rafraîchir le token d'accès
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
 *       401:
 *         description: Token de rafraîchissement invalide ou expiré
 */
router.post('/refresh-token', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Le token de rafraîchissement est requis'),
  validatorMiddleware
], authController.refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Récupérer les informations de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demander la réinitialisation du mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide')
    .normalizeEmail(),
  validatorMiddleware
], authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  body('password')
    .isLength({ min: config.security.passwordMinLength })
    .withMessage(`Le mot de passe doit contenir au moins ${config.security.passwordMinLength} caractères`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  validatorMiddleware
], authController.resetPassword);

/**
 * Routes pour l'authentification OAuth (Google)
 */
if (config.auth.googleClientId && config.auth.googleClientSecret) {
  /**
   * @swagger
   * /auth/google:
   *   get:
   *     summary: Initialiser l'authentification avec Google
   *     tags: [Auth]
   *     responses:
   *       302:
   *         description: Redirection vers Google pour l'authentification
   */
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
  /**
   * @swagger
   * /auth/google/callback:
   *   get:
   *     summary: Callback après authentification Google
   *     tags: [Auth]
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: Code d'autorisation fourni par Google
   *     responses:
   *       302:
   *         description: Redirection après authentification
   */
  router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    authController.googleCallback
  );
}

export default router;