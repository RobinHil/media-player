// server/models/folder.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Folder:
 *       type: object
 *       description: Représentation d'un dossier personnalisé ou d'une collection
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du dossier
 *         name:
 *           type: string
 *           description: Nom du dossier
 *         path:
 *           type: string
 *           description: Chemin complet du dossier physique
 *         owner:
 *           type: string
 *           description: ID de l'utilisateur propriétaire du dossier
 *         isCollection:
 *           type: boolean
 *           description: Indique s'il s'agit d'une collection virtuelle
 *         items:
 *           type: array
 *           description: Liste des chemins pour les collections virtuelles
 *         metadata:
 *           type: object
 *           description: Métadonnées supplémentaires du dossier
 *         thumbnail:
 *           type: string
 *           description: Chemin vers l'image de couverture du dossier
 *         favorite:
 *           type: boolean
 *           description: Indique si le dossier est dans les favoris
 */
const folderSchema = new mongoose.Schema(
  {
    // Nom du dossier ou de la collection
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Description du dossier
    description: {
      type: String,
      trim: true,
    },
    
    // Chemin physique du dossier (pour les dossiers réels)
    path: {
      type: String,
      trim: true,
    },
    
    // Propriétaire du dossier ou de la collection
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Si c'est une collection virtuelle plutôt qu'un dossier physique
    isCollection: {
      type: Boolean,
      default: false,
    },
    
    // Pour les collections, liste des chemins des médias inclus
    items: [{
      type: String,
      trim: true,
    }],
    
    // Position dans la liste des dossiers (tri personnalisé)
    order: {
      type: Number,
      default: 0,
    },
    
    // Métadonnées supplémentaires
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Chemin vers la miniature du dossier
    thumbnail: {
      type: String,
      trim: true,
    },
    
    // Indique si le dossier est dans les favoris
    favorite: {
      type: Boolean,
      default: false,
    },
    
    // Dossier parent (pour les collections imbriquées)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
    },
    
    // Couleur personnalisée pour l'affichage
    color: {
      type: String,
      default: '#3498db',
    },
    
    // Tags pour la recherche
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Visibilité
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
  },
  {
    timestamps: true,
  }
);

// Validation avant sauvegarde
folderSchema.pre('validate', function (next) {
  // Une collection doit avoir des items, un dossier doit avoir un chemin
  if (this.isCollection && (!this.items || this.items.length === 0)) {
    this.items = [];
  }
  
  if (!this.isCollection && !this.path) {
    return next(new Error('Un dossier physique doit avoir un chemin'));
  }
  
  next();
});

// Indexation pour optimiser les requêtes courantes
folderSchema.index({ owner: 1, path: 1 }, { unique: true, sparse: true });
folderSchema.index({ owner: 1, name: 1 });
folderSchema.index({ owner: 1, favorite: 1 });
folderSchema.index({ tags: 1 });

const Folder = mongoose.model('Folder', folderSchema);

export default Folder;