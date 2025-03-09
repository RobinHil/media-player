// server/models/setting.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Setting:
 *       type: object
 *       description: Paramètres système globaux
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique des paramètres
 *         registration:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: Inscription de nouveaux utilisateurs activée
 *             requireApproval:
 *               type: boolean
 *               description: Nécessite l'approbation d'un admin
 *         storage:
 *           type: object
 *           properties:
 *             defaultLimit:
 *               type: integer
 *               description: Limite de stockage par défaut en octets
 *         security:
 *           type: object
 *           properties:
 *             maxLoginAttempts:
 *               type: integer
 *               description: Nombre maximum de tentatives de connexion
 *             lockoutTime:
 *               type: integer
 *               description: Durée de verrouillage en secondes
 *             sessionTimeout:
 *               type: integer
 *               description: Durée d'expiration de session en secondes
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de dernière mise à jour
 */
const settingSchema = new mongoose.Schema(
  {
    // Paramètres d'inscription
    registration: {
      enabled: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
    
    // Paramètres de stockage
    storage: {
      defaultLimit: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024, // 5GB par défaut
      },
    },
    
    // Paramètres de sécurité
    security: {
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      lockoutTime: {
        type: Number,
        default: 300, // 5 minutes
      },
      sessionTimeout: {
        type: Number,
        default: 3600, // 1 heure
      },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;