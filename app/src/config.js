/**
 * Configuration principale de l'application
 */
const config = {
  // URL de base de l'API
  // apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  apiBaseUrl: 'http://localhost:3001/api',
  
  // Options d'authentification
  auth: {
    tokenStorageKey: 'media_vault_token',
    refreshTokenStorageKey: 'media_vault_refresh_token',
    tokenExpiryKey: 'media_vault_token_expiry',
    tokenType: 'Bearer',
  },
  
  // Options des médias
  media: {
    supportedVideoFormats: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts'],
    supportedImageFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.heic', '.heif', '.avif', '.tiff'],
    supportedAudioFormats: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'],
    
    // Options de lecture
    defaultVideoQuality: 'auto',
    defaultVideoFormat: 'auto',
    chunkSize: 1048576, // 1MB
    
    // Options des vignettes
    thumbnailWidth: 320,
    thumbnailHeight: 180,
  },
  
  // Options de l'interface utilisateur
  ui: {
    defaultTheme: 'system', // 'light', 'dark', ou 'system'
    itemsPerPage: 50,
    maxRecentItems: 10,
    defaultView: 'grid', // 'grid' ou 'list'
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'fr',
  },
  
  // Paramètres de sécurité
  security: {
    passwordMinLength: 8,
    sessionTimeout: 60 * 60 * 1000, // 1 heure en millisecondes
    refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes en millisecondes
    enableCSRF: true,
  }
};

export default config;