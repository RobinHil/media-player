// server/models/viewHistory.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     ViewHistory:
 *       type: object
 *       description: Historique de visualisation des fichiers
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'entrée d'historique
 *         user:
 *           type: string
 *           description: ID de l'utilisateur
 *         path:
 *           type: string
 *           description: Chemin du fichier visualisé
 *         lastViewed:
 *           type: string
 *           format: date-time
 *           description: Date de dernière visualisation
 *         viewCount:
 *           type: integer
 *           description: Nombre de visualisations
 */
const viewHistorySchema = new mongoose.Schema(
  {
    // Utilisateur
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Chemin du fichier
    path: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Dernière visualisation
    lastViewed: {
      type: Date,
      default: Date.now,
    },
    
    // Nombre de visualisations
    viewCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexation pour optimiser les requêtes courantes
viewHistorySchema.index({ user: 1, path: 1 }, { unique: true });
viewHistorySchema.index({ user: 1, lastViewed: -1 });

const ViewHistory = mongoose.model('ViewHistory', viewHistorySchema);

export default ViewHistory;