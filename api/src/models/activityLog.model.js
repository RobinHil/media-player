// server/models/activityLog.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityLog:
 *       type: object
 *       description: Journal d'activité utilisateur
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'entrée du journal
 *         action:
 *           type: string
 *           description: Type d'action effectuée
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur concerné
 *         details:
 *           type: object
 *           description: Détails supplémentaires de l'action
 *         ip:
 *           type: string
 *           description: Adresse IP de l'utilisateur
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Date et heure de l'action
 */
const activityLogSchema = new mongoose.Schema(
  {
    // Type d'action
    action: {
      type: String,
      required: true,
      enum: [
        'login', 'logout', 'register', 'reset_password', 'forgot_password', 'refresh_token',
        'upload_file', 'delete_file', 'rename_file', 'move_file',
        'share_media', 'delete_share',
        'collection_create', 'collection_delete', 'collection_add_item', 'collection_remove_item',
        'add_favorite', 'remove_favorite',
        'admin_update_user', 'admin_delete_user', 'admin_update_settings'
      ],
    },
    
    // Utilisateur concerné
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Détails supplémentaires (spécifiques à chaque action)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Adresse IP
    ip: {
      type: String,
    },
    
    // Date et heure
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

// Indexation pour optimiser les requêtes courantes
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// TTL index pour nettoyer automatiquement les journaux (par défaut: 90 jours)
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;