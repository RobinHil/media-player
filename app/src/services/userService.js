import apiClient from '../api/apiClient';

/**
 * Service de gestion des utilisateurs
 */
const userService = {
  /**
   * Récupère le profil de l'utilisateur connecté
   * @returns {Promise} Promesse résolue avec les données du profil
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour le profil de l'utilisateur
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise} Promesse résolue avec les données mises à jour
   */
  async updateProfile(userData) {
    try {
      const response = await apiClient.put('/users/profile', userData);
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  },
  
  /**
   * Change le mot de passe de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise} Promesse résolue après le changement
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les sessions actives de l'utilisateur
   * @returns {Promise} Promesse résolue avec la liste des sessions
   */
  async getSessions() {
    try {
      const response = await apiClient.get('/users/sessions');
      return response.data.sessions;
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions:', error);
      throw error;
    }
  },
  
  /**
   * Révoque une session spécifique
   * @param {string} sessionId - ID de la session à révoquer
   * @returns {Promise} Promesse résolue après la révocation
   */
  async revokeSession(sessionId) {
    try {
      const response = await apiClient.delete(`/users/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la révocation de la session:', error);
      throw error;
    }
  },
  
  /**
   * Révoque toutes les sessions sauf la session courante
   * @returns {Promise} Promesse résolue après la révocation
   */
  async revokeAllSessions() {
    try {
      const response = await apiClient.delete('/users/sessions');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la révocation des sessions:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les préférences de l'utilisateur
   * @returns {Promise} Promesse résolue avec les préférences
   */
  async getPreferences() {
    try {
      const response = await apiClient.get('/users/preferences');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour les préférences de l'utilisateur
   * @param {Object} preferences - Préférences à mettre à jour
   * @returns {Promise} Promesse résolue avec les préférences mises à jour
   */
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.put('/users/preferences', preferences);
      return response.data.preferences;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  },
  
  // Fonctions d'administration (pour les utilisateurs admin uniquement)
  
  /**
   * Récupère la liste de tous les utilisateurs (admin uniquement)
   * @returns {Promise} Promesse résolue avec la liste des utilisateurs
   */
  async getAllUsers() {
    try {
      const response = await apiClient.get('/users');
      return response.data.users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les informations d'un utilisateur spécifique (admin uniquement)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Promesse résolue avec les données de l'utilisateur
   */
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour les informations d'un utilisateur (admin uniquement)
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise} Promesse résolue avec les données mises à jour
   */
  async updateUser(userId, userData) {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },
  
  /**
   * Supprime un utilisateur (admin uniquement)
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} deleteData - Supprimer également les données de l'utilisateur
   * @returns {Promise} Promesse résolue après la suppression
   */
  async deleteUser(userId, deleteData = false) {
    try {
      const response = await apiClient.delete(`/users/${userId}?deleteData=${deleteData}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
};

export default userService;