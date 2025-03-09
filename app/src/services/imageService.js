import apiClient from '../api/apiClient';
import config from '../config';

/**
 * Service de gestion des fichiers image
 */
const imageService = {
  /**
   * Récupère l'URL d'une image
   * @param {string} path - Chemin du fichier image
   * @returns {string} URL de l'image
   */
  getImageUrl(path) {
    const encodedPath = encodeURIComponent(path);
    return `${config.apiBaseUrl}/media/stream/${encodedPath}`;
  },
  
  /**
   * Récupère les métadonnées d'un fichier image
   * @param {string} path - Chemin du fichier image
   * @returns {Promise} Promesse résolue avec les métadonnées
   */
  async getMetadata(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const response = await apiClient.get(`/media/info/${encodedPath}`);
      return response.data.metadata;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées image:', error);
      throw error;
    }
  },
  
  /**
   * Récupère l'URL de la miniature d'un fichier image
   * @param {string} path - Chemin du fichier image
   * @param {Object} options - Options de la miniature (width, height)
   * @returns {string} URL de la miniature
   */
  getThumbnailUrl(path, options = {}) {
    const { width, height } = options;
    const encodedPath = encodeURIComponent(path);
    let url = `${config.apiBaseUrl}/media/thumbnail/${encodedPath}`;
    
    // Ajouter les paramètres si fournis
    const params = [];
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return url;
  },
  
  /**
   * Ajoute un fichier image aux favoris
   * @param {string} path - Chemin du fichier image
   * @param {boolean} favorite - True pour ajouter, false pour retirer
   * @returns {Promise} Promesse résolue après l'ajout/retrait
   */
  async toggleFavorite(path, favorite) {
    try {
      const response = await apiClient.post('/files/favorites', {
        path,
        type: 'image',
        favorite
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Partage un fichier image
   * @param {string} path - Chemin du fichier image
   * @param {Object} options - Options de partage (expiresIn, requirePassword, password, maxAccesses)
   * @returns {Promise} Promesse résolue avec les informations de partage
   */
  async shareImage(path, options = {}) {
    try {
      const response = await apiClient.post('/files/share', {
        path,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du partage image:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute un fichier image à une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier image
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
   * Retire un fichier image d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin du fichier image
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
   * Télécharge un fichier image
   * @param {string} path - Chemin du fichier image
   */
  downloadImage(path) {
    const encodedPath = encodeURIComponent(path);
    const url = `${config.apiBaseUrl}/files/download?path=${encodedPath}`;
    
    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  
  /**
   * Précharge une image (utile pour le chargement anticipé)
   * @param {string} path - Chemin du fichier image
   * @returns {Promise} Promesse résolue quand l'image est préchargée
   */
  preloadImage(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = this.getImageUrl(path);
    });
  }
};

export default imageService;