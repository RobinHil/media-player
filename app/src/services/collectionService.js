import apiClient from '../api/apiClient';

/**
 * Service de gestion des collections
 */
const collectionService = {
  /**
   * Récupère toutes les collections de l'utilisateur
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
   * @param {string} description - Description de la collection (optionnel)
   * @returns {Promise} Promesse résolue avec les détails de la collection créée
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
   * Récupère les détails d'une collection
   * @param {string} collectionId - ID de la collection
   * @returns {Promise} Promesse résolue avec les détails de la collection
   */
  async getCollectionDetails(collectionId) {
    try {
      const response = await apiClient.get(`/files/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la collection:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les éléments d'une collection
   * @param {string} collectionId - ID de la collection
   * @returns {Promise} Promesse résolue avec la liste des éléments
   */
  async getCollectionItems(collectionId) {
    try {
      const response = await apiClient.get(`/files/collections/${collectionId}/items`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments de la collection:', error);
      throw error;
    }
  },
  
  /**
   * Ajoute un élément à une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin de l'élément à ajouter
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
   * Retire un élément d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {string} path - Chemin de l'élément à retirer
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
   * Met à jour les détails d'une collection
   * @param {string} collectionId - ID de la collection
   * @param {Object} updateData - Données à mettre à jour (name, description)
   * @returns {Promise} Promesse résolue avec les détails mis à jour
   */
  async updateCollection(collectionId, updateData) {
    try {
      const response = await apiClient.put(`/files/collections/${collectionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la collection:', error);
      throw error;
    }
  },
  
  /**
   * Supprime une collection
   * @param {string} collectionId - ID de la collection
   * @returns {Promise} Promesse résolue après la suppression
   */
  async deleteCollection(collectionId) {
    try {
      const response = await apiClient.delete(`/files/collections/${collectionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la collection:', error);
      throw error;
    }
  }
};

export default collectionService;