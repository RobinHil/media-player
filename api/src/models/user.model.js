// server/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'utilisateur
 *         email:
 *           type: string
 *           description: Adresse email de l'utilisateur
 *         name:
 *           type: string
 *           description: Nom complet de l'utilisateur
 *         password:
 *           type: string
 *           description: Mot de passe hashé (jamais renvoyé dans les réponses)
 *         role:
 *           type: string
 *           enum: [user, editor, admin]
 *           description: Rôle de l'utilisateur
 *         active:
 *           type: boolean
 *           description: Indique si le compte est actif
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du compte
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Date de dernière connexion
 *         preferences:
 *           type: object
 *           description: Préférences utilisateur
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    password: {
      type: String,
      required: function() {
        // Le mot de passe n'est requis que si l'utilisateur n'a pas d'authentification OAuth
        return !this.google && !this.facebook;
      },
      select: false, // Ne pas inclure par défaut dans les requêtes
    },
    role: {
      type: String,
      enum: ['user', 'editor', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    google: {
      id: String,
      email: String,
      name: String,
      token: String,
    },
    facebook: {
      id: String,
      email: String,
      name: String,
      token: String,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      language: {
        type: String,
        default: 'fr',
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      playerSettings: {
        autoplay: {
          type: Boolean,
          default: true,
        },
        quality: {
          type: String,
          enum: ['auto', '240p', '360p', '480p', '720p', '1080p'],
          default: 'auto',
        },
        subtitles: {
          type: Boolean,
          default: true,
        },
        volume: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
      },
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);

// Middleware pré-sauvegarde pour hacher le mot de passe
userSchema.pre('save', async function (next) {
  const user = this;
  
  // Vérifier si le mot de passe a été modifié
  if (!user.isModified('password')) return next();
  
  try {
    // Générer un sel et hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir l'objet utilisateur sans données sensibles
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;