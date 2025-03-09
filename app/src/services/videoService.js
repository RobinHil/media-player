import apiClient from '../api/apiClient';
import config from '../config';

/**
 * Service de gestion des fichiers vidéo
 */
const videoService = {
  /**
   * Récupère l'URL de streaming d'un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
   * @param {string} quality - Qualité demandée (auto, 240p, 360p, 480p, 720p, 1080p)
   * @param {string} format - Format demandé (auto, mp4, webm, hls)
   * @returns {string} URL de streaming
   */
  getStreamUrl(path, quality = 'auto', format = 'auto') {
    const encodedPath = encodeURIComponent(path);
    return `${config.apiBaseUrl}/media/stream/${encodedPath}?quality=${quality}&format=${format}`;
  },
  
  /**
   * Récupère les métadonnées d'un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
   * @returns {Promise} Promesse résolue avec les métadonnées
   */
  async getMetadata(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/info/${encodedPath}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées vidéo:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les formats disponibles pour un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
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
   * Récupère les sous-titres disponibles pour un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
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
   * Récupère l'URL de la miniature d'un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
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
    if (time !== undefined) params.push(`time=${time}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return url;
  },
  
  /**
   * Ajoute un fichier vidéo aux favoris
   * @param {string} path - Chemin du fichier vidéo
   * @param {boolean} favorite - True pour ajouter, false pour retirer
   * @returns {Promise} Promesse résolue après l'ajout/retrait
   */
  async toggleFavorite(path, favorite) {
    try {
      const response = await apiClient.post('/files/favorites', {
        path,
        type: 'video',
        favorite
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Partage un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
   * @param {Object} options - Options de partage (expiresIn, requirePassword, password, maxAccesses)
   * @returns {Promise} Promesse résolue avec les informations de partage
   */
  async shareVideo(path, options = {}) {
    try {
      const response = await apiClient.post('/files/share', {
        path,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du partage vidéo:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute un fichier vidéo à une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier vidéo
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
   * Retire un fichier vidéo d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier vidéo
   * @returns {Promise} Promesse résolue après le retrait
   */
  async removeFromCollection(collectionId, path) {
    try {
      const response = await apiClient.delete(`/files/collections/${collectionId}/items`, {
        data: { path }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait de la collection:', error);
      throw error;
    }
  },
  
  /**
   * Télécharge un fichier vidéo
   * @param {string} path - Chemin du fichier vidéo
   */
  downloadVideo(path) {
    const encodedPath = encodeURIComponent(path);
    const url = `${config.apiBaseUrl}/files/download?path=${encodedPath}`;
    
    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'video';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export default videoService;