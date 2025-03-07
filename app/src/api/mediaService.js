import apiClient from './apiClient';
import config from '../config';

/**
 * Service de gestion des médias
 */
const mediaService = {
  /**
   * Récupère la liste des fichiers et dossiers dans un chemin donné
   * @param {string} path - Chemin du dossier à explorer
   * @param {string} type - Type de fichiers à filtrer (all, video, image, audio)
   * @returns {Promise} Promesse résolue avec les données des fichiers et dossiers
   */
  async getFiles(path = '', type = 'all') {
    try {
      const response = await apiClient.get('/files', {
        params: { path, type }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Recherche des fichiers
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de fichiers à filtrer (all, video, image, audio)
   * @returns {Promise} Promesse résolue avec les résultats de recherche
   */
  async searchFiles(query, type = 'all') {
    try {
      const response = await apiClient.get('/files/search', {
        params: { query, type }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les collections de l'utilisateur
   * @returns {Promise} Promesse résolue avec la liste des collections
   */
  async getCollections() {
    try {
      const response = await apiClient.get('/files/collections');
      return response.data.collections;
    } catch (error) {
      console.error('Erreur lors de la récupération des collections:', error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle collection
   * @param {string} name - Nom de la collection
   * @param {string} description - Description de la collection
   * @returns {Promise} Promesse résolue avec les données de la collection créée
   */
  async createCollection(name, description = '') {
    try {
      const response = await apiClient.post('/files/collections', {
        name,
        description
      });
      return response.data.collection;
    } catch (error) {
      console.error('Erreur lors de la création de la collection:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute un élément à une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier à ajouter
   * @returns {Promise} Promesse résolue après l'ajout
   */
  async addToCollection(collectionId, path) {
    try {
      const response = await apiClient.post(`/files/collections/${collectionId}/items`, {
        path
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la collection:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les favoris de l'utilisateur
   * @returns {Promise} Promesse résolue avec la liste des favoris
   */
  async getFavorites() {
    try {
      const response = await apiClient.get('/files/favorites');
      return response.data.favorites;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute ou retire un élément des favoris
   * @param {string} path - Chemin du fichier ou dossier
   * @param {string} type - Type d'élément (folder, collection)
   * @param {boolean} favorite - True pour ajouter, false pour retirer
   * @returns {Promise} Promesse résolue après la modification
   */
  async toggleFavorite(path, type, favorite) {
    try {
      const response = await apiClient.post('/files/favorites', {
        path,
        type,
        favorite
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Obtient l'URL de streaming d'un fichier média
   * @param {string} path - Chemin du fichier
   * @param {string} quality - Qualité demandée (auto, 240p, 360p, 480p, 720p, 1080p)
   * @param {string} format - Format demandé (auto, mp4, webm, hls)
   * @returns {string} URL de streaming
   */
  getStreamUrl(path, quality = 'auto', format = 'auto') {
    const encodedPath = encodeURIComponent(path);
    return `${config.apiBaseUrl}/media/stream/${encodedPath}?quality=${quality}&format=${format}`;
  },
  
  /**
   * Obtient l'URL de la miniature d'un fichier
   * @param {string} path - Chemin du fichier
   * @param {Object} options - Options de la miniature (width, height, time)
   * @returns {string} URL de la miniature
   */
  getThumbnailUrl(path, options = {}) {
    const { width, height, time } = options;
    const encodedPath = encodeURIComponent(path);
    let url = `${config.apiBaseUrl}/media/thumbnail/${encodedPath}`;
    
    // Ajouter les paramètres si fournis
    const params = [];
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    if (time) params.push(`time=${time}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return url;
  },
  
  /**
   * Obtient les informations détaillées sur un fichier média
   * @param {string} path - Chemin du fichier
   * @returns {Promise} Promesse résolue avec les informations du fichier
   */
  async getMediaInfo(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/info/${encodedPath}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations média:', error);
      throw error;
    }
  },
  
  /**
   * Obtient les formats disponibles pour un fichier vidéo
   * @param {string} path - Chemin du fichier
   * @returns {Promise} Promesse résolue avec les formats disponibles
   */
  async getAvailableFormats(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/formats/${encodedPath}`);
      return response.data.formats;
    } catch (error) {
      console.error('Erreur lors de la récupération des formats disponibles:', error);
      throw error;
    }
  },
  
  /**
   * Obtient les sous-titres disponibles pour un fichier vidéo
   * @param {string} path - Chemin du fichier
   * @returns {Promise} Promesse résolue avec les sous-titres disponibles
   */
  async getSubtitles(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/subtitles/${encodedPath}`);
      return response.data.subtitles;
    } catch (error) {
      console.error('Erreur lors de la récupération des sous-titres:', error);
      throw error;
    }
  },
  
  /**
   * Partage un fichier ou un dossier
   * @param {string} path - Chemin du fichier/dossier
   * @param {Object} options - Options de partage (expiresIn, requirePassword, maxAccesses)
   * @returns {Promise} Promesse résolue avec les informations de partage
   */
  async shareMedia(path, options = {}) {
    try {
      const response = await apiClient.post('/files/share', {
        path,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      throw error;
    }
  }
};

export default mediaService;