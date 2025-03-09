import apiClient from '../api/apiClient';
import config from '../config';

/**
 * Service de gestion des fichiers et dossiers
 */
const fileService = {
  /**
   * Récupère la liste des fichiers et dossiers
   * @param {string} path - Chemin du dossier à explorer (optionnel)
   * @param {string} type - Type de fichiers à filtrer (all, video, audio, image)
   * @returns {Promise} Promesse résolue avec la liste des fichiers et dossiers
   */
  async getFiles(path = '', type = 'all') {
    try {
      const params = new URLSearchParams();
      if (path) {
        params.append('path', path);
      }
      if (type && type !== 'all') {
        params.append('type', type);
      }
      
      const response = await apiClient.get(`/files?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Recherche des fichiers
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de fichiers à filtrer (all, video, audio, image)
   * @returns {Promise} Promesse résolue avec les résultats de recherche
   */
  async searchFiles(query, type = 'all') {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (type && type !== 'all') {
        params.append('type', type);
      }
      
      const response = await apiClient.get(`/files/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les fichiers récemment consultés
   * @param {number} limit - Nombre maximum de fichiers à récupérer
   * @returns {Promise} Promesse résolue avec la liste des fichiers récents
   */
  async getRecentFiles(limit = 20) {
    try {
      const response = await apiClient.get(`/files/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers récents:', error);
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
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute ou retire un élément des favoris
   * @param {string} path - Chemin du fichier ou dossier
   * @param {string} type - Type d'élément (file, folder)
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
   * Télécharge un fichier sur le serveur
   * @param {FormData} formData - Données du fichier
   * @param {string} path - Chemin de destination (optionnel)
   * @param {Function} progressCallback - Callback pour suivre la progression
   * @returns {Promise} Promesse résolue avec les informations du fichier uploadé
   */
  async uploadFile(formData, path = '', progressCallback = null) {
    try {
      let url = '/files/upload';
      if (path) {
        url += `?path=${encodeURIComponent(path)}`;
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Ajouter le suivi de progression si un callback est fourni
      if (progressCallback && typeof progressCallback === 'function') {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progressCallback(percentCompleted);
        };
      }
      
      const response = await apiClient.post(url, formData, config);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  },
  
  /**
   * Télécharge plusieurs fichiers sur le serveur
   * @param {Array<File>} files - Tableau de fichiers
   * @param {string} path - Chemin de destination (optionnel)
   * @param {Function} progressCallback - Callback pour suivre la progression
   * @returns {Promise} Promesse résolue avec les informations des fichiers uploadés
   */
  async uploadFiles(files, path = '', progressCallback = null) {
    try {
      const results = [];
      
      // Upload chaque fichier individuellement
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        // Créer un callback spécifique pour ce fichier
        const fileProgressCallback = progressCallback
          ? (progress) => progressCallback(files[i], progress)
          : null;
        
        const result = await this.uploadFile(formData, path, fileProgressCallback);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Crée un nouveau dossier
   * @param {string} path - Chemin où créer le dossier
   * @param {string} name - Nom du dossier
   * @returns {Promise} Promesse résolue après la création
   */
  async createFolder(path, name) {
    try {
      const fullPath = path ? `${path}/${name}` : name;
      const response = await apiClient.post('/files/folder', {
        path: fullPath
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw error;
    }
  },
  
  /**
   * Supprime un fichier ou un dossier
   * @param {string} path - Chemin du fichier ou dossier à supprimer
   * @param {boolean} recursive - Supprimer récursivement (pour les dossiers)
   * @returns {Promise} Promesse résolue après la suppression
   */
  async deleteItem(path, recursive = true) {
    try {
      const response = await apiClient.delete(`/files?path=${encodeURIComponent(path)}&recursive=${recursive}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },
  
  /**
   * Renomme un fichier ou un dossier
   * @param {string} path - Chemin du fichier ou dossier à renommer
   * @param {string} newName - Nouveau nom
   * @returns {Promise} Promesse résolue après le renommage
   */
  async renameItem(path, newName) {
    try {
      const parentDir = path.substring(0, path.lastIndexOf('/') + 1);
      const newPath = parentDir + newName;
      
      const response = await apiClient.put('/files', {
        oldPath: path,
        newPath: newPath
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du renommage:', error);
      throw error;
    }
  },
  
  /**
   * Déplace un fichier ou un dossier
   * @param {string} path - Chemin du fichier ou dossier à déplacer
   * @param {string} destination - Chemin de destination
   * @returns {Promise} Promesse résolue après le déplacement
   */
  async moveItem(path, destination) {
    try {
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      const newPath = destination.endsWith('/') ? destination + fileName : destination + '/' + fileName;
      
      const response = await apiClient.put('/files', {
        oldPath: path,
        newPath: newPath
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      throw error;
    }
  },
  
  /**
   * Copie un fichier ou un dossier
   * @param {string} path - Chemin du fichier ou dossier à copier
   * @param {string} destination - Chemin de destination
   * @returns {Promise} Promesse résolue après la copie
   */
  async copyItem(path, destination) {
    try {
      const response = await apiClient.post('/files/copy', {
        path,
        destination
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      throw error;
    }
  },
  
  /**
   * Télécharge un fichier
   * @param {string} path - Chemin du fichier à télécharger
   */
  downloadFile(path) {
    try {
      const encodedPath = encodeURIComponent(path);
      const url = `${config.apiBaseUrl}/files/download?path=${encodedPath}`;
      
      // Créer un élément a temporaire pour déclencher le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }
};

export default fileService;