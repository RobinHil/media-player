// server/config/database.js
import mongoose from 'mongoose';
import config from './config.js';
import logger from '../utils/logger.js';

export const connectDatabase = async () => {
  try {
    // Configuration de mongoose
    mongoose.set('strictQuery', true);
    
    // Connexion à MongoDB
    await mongoose.connect(config.database.uri, config.database.options);
    
    logger.info('Connexion à la base de données MongoDB établie avec succès');
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error('Erreur de connexion MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Déconnexion de MongoDB');
    });
    
    // Gérer la fermeture propre de la connexion lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
        process.exit(0);
      } catch (err) {
        logger.error('Erreur lors de la fermeture de la connexion MongoDB:', err);
        process.exit(1);
      }
    });
    
    return mongoose.connection;
  } catch (err) {
    logger.error('Impossible de se connecter à la base de données MongoDB:', err);
    process.exit(1);
  }
};

export default mongoose;