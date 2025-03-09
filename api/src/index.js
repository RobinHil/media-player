// server/index.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

// Import de la configuration
import config from './config/config.js';
import { setupSwagger } from './docs/swagger-autogen.js';
import { setupPassport } from './config/passport.js';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';
import errorMiddleware, { notFoundMiddleware } from './middleware/error.middleware.js';
import rateLimiter from './middleware/rateLimiter.middleware.js';

// Import des routes
import authRoutes from './routes/auth.routes.js';
import filesRoutes from './routes/files.routes.js';
import mediaRoutes from './routes/media.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sharedRoutes from './routes/shared.routes.js';

// Initialisation de l'application Express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connexion à la base de données
connectDatabase();

// Configuration des middlewares généraux
app.use(helmet()); // Sécurité HTTP
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));
app.use(compression()); // Compression de la réponse
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parser des cookies
app.use(morgan('dev')); // Logs des requêtes HTTP

// Middleware de limitation de débit
app.use(rateLimiter);

// Configuration de Passport.js
const passport = setupPassport(app);

// Middleware pour les fichiers statiques
if (config.server.env === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Configuration de Swagger
const swaggerSpec = setupSwagger();
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rendre les modèles disponibles à l'application
import User from './models/user.model.js';
import Session from './models/session.model.js';
import MediaAccess from './models/mediaAccess.model.js';
import Folder from './models/folder.model.js';
import ViewHistory from './models/viewHistory.model.js';
import ActivityLog from './models/activityLog.model.js';
import Setting from './models/setting.model.js';
import Favorite from './models/favorite.model.js';

app.set('models', {
  User,
  Session,
  MediaAccess,
  Folder,
  ViewHistory,
  ActivityLog,
  Setting,
  Favorite
});

// Montage des routes API
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/files', filesRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/shared', sharedRoutes);

// Préfixage de toutes les routes API
app.use(config.server.apiPrefix, apiRouter);

// Route pour servir l'application React en production
if (config.server.env === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

const welcomeMessage = 'Bienvenue sur notre API ! Pour consulter la documentation, veuillez visiter <a href="/api/docs">/api/docs</a>';

// Affichage d'un message de bienvenue sur la route racine
app.get('/', (req, res) => {
  res.send(welcomeMessage);
});

// Affichage d'un message de bienvenue sur la route API racine
app.get('/api/', (req, res) => {
  res.send(welcomeMessage);
});

// Middleware pour les routes non trouvées
app.use(notFoundMiddleware);

// Middleware de gestion des erreurs
app.use(errorMiddleware);

// Démarrage du serveur
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Serveur démarré en mode ${config.server.env} sur http://localhost:${PORT}`);
  logger.info(`Documentation API disponible sur http://localhost:${PORT}/api/docs`);
});

// Gestion des erreurs non traitées
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // En cas d'erreur critique, arrêter le serveur proprement
  process.exit(1);
});

export default app;