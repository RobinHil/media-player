// server/models/mediaAccess.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     MediaAccess:
 *       type: object
 *       description: Droits d'accès aux médias par utilisateur ou par groupe
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'autorisation d'accès
 *         path:
 *           type: string
 *           description: Chemin du dossier ou fichier concerné par l'autorisation
 *         user:
 *           type: string
 *           description: ID de l'utilisateur concerné (si applicable)
 *         role:
 *           type: string
 *           description: Rôle concerné par l'autorisation (si applicable)
 *         permissions:
 *           type: object
 *           properties:
 *             read:
 *               type: boolean
 *               description: Permission de lecture
 *             write:
 *               type: boolean
 *               description: Permission d'écriture
 *             delete:
 *               type: boolean
 *               description: Permission de suppression
 *             share:
 *               type: boolean
 *               description: Permission de partage
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de l'autorisation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour de l'autorisation
 */
const mediaAccessSchema = new mongoose.Schema(
  {
    // Chemin du média ou du dossier
    path: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Référence à l'utilisateur (si c'est une autorisation pour un utilisateur spécifique)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Ou un rôle (si c'est une autorisation basée sur le rôle)
    role: {
      type: String,
      enum: ['user', 'editor', 'admin'],
    },
    
    // Permissions spécifiques
    permissions: {
      read: {
        type: Boolean,
        default: true,
      },
      write: {
        type: Boolean,
        default: false,
      },
      delete: {
        type: Boolean,
        default: false,
      },
      share: {
        type: Boolean,
        default: false,
      },
    },
    
    // Héritage des permissions pour les sous-dossiers
    recursive: {
      type: Boolean,
      default: false,
    },
    
    // Date d'expiration des permissions (optionnel)
    expiresAt: {
      type: Date,
    },
    
    // Clé de partage pour les liens partagés
    shareKey: String,
    
    // Configuration des limites pour le partage
    shareConfig: {
      // Nombre maximal d'accès pour ce partage
      maxAccesses: {
        type: Number,
      },
      // Nombre d'accès actuels
      accessCount: {
        type: Number,
        default: 0,
      },
      // Mot de passe optionnel pour le partage
      password: {
        type: String,
      },
      // Exiger un compte utilisateur pour accéder au partage
      requireAccount: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Assurer qu'un utilisateur ou un rôle est spécifié, mais pas les deux
mediaAccessSchema.pre('validate', function (next) {
  if (this.user && this.role) {
    return next(new Error('Une autorisation ne peut pas concerner à la fois un utilisateur et un rôle'));
  }
  if (!this.user && !this.role && !this.shareKey) {
    return next(new Error('Une autorisation doit concerner soit un utilisateur, soit un rôle, soit avoir une clé de partage'));
  }
  next();
});

// Supprimer tous les index précédents et créer uniquement ceux dont nous avons besoin
// Cette approche évite les problèmes de duplication d'index
mediaAccessSchema.index({ path: 1, user: 1 }, { sparse: true });
mediaAccessSchema.index({ path: 1, role: 1 }, { sparse: true });
mediaAccessSchema.index({ shareKey: 1 }, { sparse: true });
mediaAccessSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MediaAccess = mongoose.model('MediaAccess', mediaAccessSchema);

export default MediaAccess;