import apiClient from '../api/apiClient';
import config from '../config';

/**
 * Service de gestion des fichiers audio
 */
const audioService = {
  /**
   * Récupère l'URL de streaming d'un fichier audio
   * @param {string} path - Chemin du fichier audio
   * @returns {string} URL de streaming
   */
  getStreamUrl(path) {
    const encodedPath = encodeURIComponent(path);
    return `${config.apiBaseUrl}/media/stream/${encodedPath}`;
  },
  
  /**
   * Récupère les métadonnées d'un fichier audio
   * @param {string} path - Chemin du fichier audio
   * @returns {Promise} Promesse résolue avec les métadonnées
   */
  async getMetadata(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/info/${encodedPath}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées audio:', error);
      throw error;
    }
  },
  
  /**
   * Récupère l'URL de la miniature d'un fichier audio
   * @param {string} path - Chemin du fichier audio
   * @returns {string} URL de la miniature
   */
  getThumbnailUrl(path) {
    const encodedPath = encodeURIComponent(path);
    return `${config.apiBaseUrl}/media/thumbnail/${encodedPath}`;
  },
  
  /**
   * Ajoute un fichier audio aux favoris
   * @param {string} path - Chemin du fichier audio
   * @param {boolean} favorite - True pour ajouter, false pour retirer
   * @returns {Promise} Promesse résolue après l'ajout/retrait
   */
  async toggleFavorite(path, favorite) {
    try {
      const response = await apiClient.post('/files/favorites', {
        path,
        type: 'audio',
        favorite
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Partage un fichier audio
   * @param {string} path - Chemin du fichier audio
   * @param {Object} options - Options de partage (expiresIn, requirePassword, password, maxAccesses)
   * @returns {Promise} Promesse résolue avec les informations de partage
   */
  async shareAudio(path, options = {}) {
    try {
      const response = await apiClient.post('/files/share', {
        path,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du partage audio:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute un fichier audio à une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier audio
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
   * Retire un fichier audio d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier audio
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
   * Télécharge un fichier audio
   * @param {string} path - Chemin du fichier audio
   */
  downloadAudio(path) {
    const encodedPath = encodeURIComponent(path);
    const url = `${config.apiBaseUrl}/files/download?path=${encodedPath}`;
    
    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'audio';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export default audioService;