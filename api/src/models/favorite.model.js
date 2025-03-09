// server/models/favorite.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       description: Représentation d'un favori (fichier, dossier)
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du favori
 *         user:
 *           type: string
 *           description: ID de l'utilisateur propriétaire du favori
 *         path:
 *           type: string
 *           description: Chemin complet du fichier ou dossier
 *         type:
 *           type: string
 *           enum: [file, folder]
 *           description: Type d'élément
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date d'ajout aux favoris
 */
const favoriteSchema = new mongoose.Schema(
  {
    // Propriétaire du favori
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Chemin du fichier ou dossier
    path: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Type d'élément (fichier ou dossier)
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Indexation pour optimiser les requêtes courantes
favoriteSchema.index({ user: 1, path: 1, type: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;