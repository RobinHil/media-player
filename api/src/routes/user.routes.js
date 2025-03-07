// server/routes/user.routes.js
import express from 'express';
import { body, param } from 'express-validator';
import authMiddleware from '../middleware/auth.middleware.js';
import adminMiddleware from '../middleware/admin.middleware.js';
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
router.get('/profile', (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user: user.toSafeObject()
  });
});

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
 *               preferences:
 *                 type: object
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
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Les préférences doivent être un objet'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Thème invalide'),
  body('preferences.language')
    .optional()
    .isString()
    .withMessage('La langue doit être une chaîne de caractères'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('La valeur notifications doit être un booléen'),
  validatorMiddleware
], async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = req.user;

    // Mettre à jour le nom si fourni
    if (name) {
      user.name = name;
    }

    // Mettre à jour les préférences si fournies
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
});

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
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await req.user.constructor.findById(req.user._id).select('+password');

    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
});

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
 */
router.get('/sessions', async (req, res) => {
  try {
    // Importer le modèle Session
    const Session = req.app.get('models').Session;

    // Récupérer toutes les sessions actives de l'utilisateur
    const sessions = await Session.find({
      user: req.user._id,
      active: true,
      expiresAt: { $gt: new Date() }
    }).select('-refreshToken');

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sessions',
      error: error.message
    });
  }
});

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
], async (req, res) => {
  try {
    // Importer le modèle Session
    const Session = req.app.get('models').Session;

    // Vérifier que la session appartient à l'utilisateur
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }

    // Révoquer la session
    session.active = false;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session révoquée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation de la session',
      error: error.message
    });
  }
});

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
 */
router.delete('/sessions', async (req, res) => {
  try {
    // Importer le modèle Session
    const Session = req.app.get('models').Session;

    // Obtenir l'ID de refresh token actuel depuis le cookie ou le header
    const currentRefreshToken = req.cookies['refresh_token'] || 
                               (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
                               req.headers.authorization.split(' ')[1] : null);

    // Révoquer toutes les autres sessions
    await Session.updateMany(
      {
        user: req.user._id,
        active: true,
        refreshToken: { $ne: currentRefreshToken }
      },
      {
        active: false
      }
    );

    res.status(200).json({
      success: true,
      message: 'Toutes les autres sessions ont été révoquées avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la révocation des sessions',
      error: error.message
    });
  }
});

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
router.get('/', async (req, res) => {
  try {
    // Importer le modèle User
    const User = req.user.constructor;

    // Récupérer tous les utilisateurs
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
});

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
], async (req, res) => {
  try {
    // Importer le modèle User
    const User = req.user.constructor;

    // Récupérer l'utilisateur
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
});

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
], async (req, res) => {
  try {
    // Importer le modèle User
    const User = req.user.constructor;

    // Récupérer l'utilisateur
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs
    const { name, email, role, active } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
});

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
  validatorMiddleware
], async (req, res) => {
  try {
    // Importer le modèle User
    const User = req.user.constructor;

    // Vérifier que l'utilisateur n'essaie pas de se supprimer lui-même
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'utilisateur
    await user.remove();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
});

export default router;