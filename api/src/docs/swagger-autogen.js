// server/docs/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration pour la génération de la documentation Swagger
 */
export const setupSwagger = () => {
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'API de Streaming de Médias',
      version: '1.0.0',
      description: 'API REST pour le streaming de vidéos, images et autres médias',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'Support API',
        url: 'https://votre-site.com',
        email: 'contact@votre-site.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}${config.server.apiPrefix}`,
        description: 'Serveur de développement',
      },
      {
        url: `https://api.votre-site.com${config.server.apiPrefix}`,
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message d\'erreur',
            },
            status: {
              type: 'integer',
              description: 'Code d\'état HTTP',
            },
            error: {
              type: 'string',
              description: 'Type d\'erreur',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de l\'utilisateur',
            },
            name: {
              type: 'string',
              description: 'Nom de l\'utilisateur',
            },
            email: {
              type: 'string',
              description: 'Adresse email de l\'utilisateur',
            },
            role: {
              type: 'string',
              description: 'Rôle de l\'utilisateur: user, admin, etc.',
            },
            active: {
              type: 'boolean',
              description: 'Statut du compte utilisateur',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Nom du fichier',
            },
            type: {
              type: 'string',
              description: 'Type de fichier (video, image, audio, etc.)',
            },
            size: {
              type: 'integer',
              description: 'Taille du fichier en octets',
            },
            path: {
              type: 'string',
              description: 'Chemin relatif du fichier',
            },
            modified: {
              type: 'string',
              format: 'date-time',
              description: 'Date de dernière modification',
            },
            thumbnail: {
              type: 'string',
              description: 'URL de la miniature (si applicable)',
            },
            metadata: {
              type: 'object',
              description: 'Métadonnées supplémentaires du fichier',
            }
          },
        },
        Folder: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Nom du dossier',
            },
            path: {
              type: 'string',
              description: 'Chemin relatif du dossier',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Mot de passe de l\'utilisateur',
            },
            rememberMe: {
              type: 'boolean',
              description: 'Maintenir la session active',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token d\'accès',
            },
            refreshToken: {
              type: 'string',
              description: 'Token de rafraîchissement',
            },
            expiresIn: {
              type: 'number',
              description: 'Durée de validité en secondes',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Accès non autorisé',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                        },
                        message: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion des utilisateurs',
      },
      {
        name: 'Files',
        description: 'Navigation et gestion des fichiers et dossiers',
      },
      {
        name: 'Media',
        description: 'Streaming et manipulation des médias',
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs et des permissions',
      },
    ],
  };

  const options = {
    swaggerDefinition,
    apis: [
      join(__dirname, '../routes/*.js'),
      join(__dirname, '../controllers/*.js'),
      join(__dirname, '../models/*.js'),
    ],
  };

  return swaggerJSDoc(options);
};

// Génération de la documentation Swagger avec swagger-autogen
// Ce fichier peut être exécuté indépendamment pour générer la documentation
export const generateSwaggerDocs = async () => {
  const swaggerAutogen = (await import('swagger-autogen')).default;
  
  const outputFile = join(__dirname, 'swagger-output.json');
  const endpointsFiles = [
    join(__dirname, '../routes/auth.routes.js'),
    join(__dirname, '../routes/files.routes.js'),
    join(__dirname, '../routes/media.routes.js'),
    join(__dirname, '../routes/user.routes.js'),
  ];

  await swaggerAutogen(outputFile, endpointsFiles, setupSwagger().swaggerDefinition);
  console.log(`Documentation Swagger générée avec succès: ${outputFile}`);
};

// Si ce fichier est exécuté directement, générer la documentation
if (import.meta.url === `file://${__filename}`) {
  generateSwaggerDocs();
}