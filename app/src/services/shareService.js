import apiClient from '../api/apiClient';
import config from '../config';

/**
 * Service de gestion des partages
 */
const shareService = {
  /**
   * Partage un fichier ou un dossier
   * @param {string} path - Chemin du fichier/dossier
   * @param {Object} options - Options de partage
   * @param {number} options.expiresIn - Durée de validité en secondes
   * @param {boolean} options.requirePassword - Protection par mot de passe
   * @param {string} options.password - Mot de passe
   * @param {number} options.maxAccesses - Nombre maximum d'accès
   * @returns {Promise} Promesse résolue avec les infos de partage
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
  },
  
  /**
   * Récupère la liste des partages de l'utilisateur
   * @returns {Promise} Promesse résolue avec la liste des partages
   */
  async getSharedItems() {
    try {
      const response = await apiClient.get('/files/shared');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des partages:', error);
      throw error;
    }
  },
  
  /**
   * Supprime un partage
   * @param {string} shareId - ID du partage
   * @returns {Promise} Promesse résolue après la suppression
   */
  async deleteShare(shareId) {
    try {
      const response = await apiClient.delete(`/files/share/${shareId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les informations d'un contenu partagé (accès public)
   * @param {string} token - Token de partage
   * @returns {Promise} Promesse résolue avec les infos du média
   */
  async getSharedInfo(token) {
    try {
      const response = await apiClient.get(`/shared/${token}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos du partage:', error);
      throw error;
    }
  },
  
  /**
   * Accède à un contenu partagé protégé par mot de passe
   * @param {string} token - Token de partage
   * @param {string} password - Mot de passe
   * @returns {Promise} Promesse résolue avec le token d'accès
   */
  async accessSharedContent(token, password) {
    try {
      const response = await apiClient.post(`/shared/${token}/access`, {
        password
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'accès au contenu partagé:', error);
      throw error;
    }
  },
  
  /**
   * Obtient l'URL de streaming d'un contenu partagé
   * @param {string} token - Token de partage
   * @param {string} accessToken - Token d'accès (si protégé par mot de passe)
   * @param {Object} options - Options de streaming (quality, format)
   * @returns {string} URL de streaming
   */
  getSharedStreamUrl(token, accessToken = null, options = {}) {
    let url = `${config.apiBaseUrl}/shared/stream/${token}`;
    const params = [];
    
    if (accessToken) {
      params.push(`accessToken=${accessToken}`);
    }
    
    if (options.quality) {
      params.push(`quality=${options.quality}`);
    }
    
    if (options.format) {
      params.push(`format=${options.format}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return url;
  },
  
  /**
   * Obtient l'URL de la miniature d'un contenu partagé
   * @param {string} token - Token de partage
   * @param {string} accessToken - Token d'accès (si protégé par mot de passe)
   * @param {Object} options - Options de miniature (width, height, time)
   * @returns {string} URL de la miniature
   */
  getSharedThumbnailUrl(token, accessToken = null, options = {}) {
    const { width, height, time } = options;
    let url = `${config.apiBaseUrl}/shared/thumbnail/${token}`;
    const params = [];
    
    if (accessToken) {
      params.push(`accessToken=${accessToken}`);
    }
    
    if (width) {
      params.push(`width=${width}`);
    }
    
    if (height) {
      params.push(`height=${height}`);
    }
    
    if (time !== undefined) {
      params.push(`time=${time}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return url;
  },
  
  /**
   * Télécharge un contenu partagé
   * @param {string} token - Token de partage
   * @param {string} accessToken - Token d'accès (si protégé par mot de passe)
   * @param {string} filename - Nom du fichier
   */
  downloadSharedContent(token, accessToken = null, filename = 'download') {
    let url = `${config.apiBaseUrl}/shared/download/${token}`;
    
    if (accessToken) {
      url += `?accessToken=${accessToken}`;
    }
    
    // Créer un élément a temporaire pour déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

export default shareService;