// server/models/session.model.js
import mongoose from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la session
 *         user:
 *           type: string
 *           description: ID de l'utilisateur associé à la session
 *         refreshToken:
 *           type: string
 *           description: Token de rafraîchissement
 *         userAgent:
 *           type: string
 *           description: Agent utilisateur du client
 *         ip:
 *           type: string
 *           description: Adresse IP du client
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Date d'expiration de la session
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Date de dernière activité
 */
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexer pour une expiration automatique des sessions (TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexer pour une recherche rapide par utilisateur et état actif
sessionSchema.index({ user: 1, active: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;