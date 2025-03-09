import apiClient from '../api/apiClient';

/**
 * Service de gestion des fonctionnalités d'administration
 */
const adminService = {
  /**
   * Récupère les journaux d'activité (admin uniquement)
   * @param {Object} options - Options de filtrage
   * @param {number} options.page - Numéro de page
   * @param {number} options.limit - Nombre d'entrées par page
   * @param {string} options.type - Type d'activité à filtrer
   * @param {string} options.userId - ID utilisateur à filtrer
   * @returns {Promise} Promesse résolue avec les journaux et la pagination
   */
  async getLogs(options = {}) {
    try {
      const { page = 1, limit = 20, type, userId } = options;
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (type) {
        params.append('type', type);
      }
      
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await apiClient.get(`/admin/logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des journaux d\'activité:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les statistiques globales (admin uniquement)
   * @returns {Promise} Promesse résolue avec les statistiques
   */
  async getStats() {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les paramètres globaux (admin uniquement)
   * @returns {Promise} Promesse résolue avec les paramètres
   */
  async getSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour les paramètres globaux (admin uniquement)
   * @param {Object} settings - Paramètres à mettre à jour
   * @param {Object} settings.registration - Paramètres d'inscription
   * @param {boolean} settings.registration.enabled - Inscription activée
   * @param {boolean} settings.registration.requireApproval - Approbation requise
   * @param {Object} settings.storage - Paramètres de stockage
   * @param {number} settings.storage.defaultLimit - Limite par défaut
   * @param {Object} settings.security - Paramètres de sécurité
   * @param {number} settings.security.maxLoginAttempts - Nombre max de tentatives
   * @param {number} settings.security.lockoutTime - Temps de verrouillage
   * @param {number} settings.security.sessionTimeout - Timeout de session
   * @returns {Promise} Promesse résolue avec les paramètres mis à jour
   */
  async updateSettings(settings) {
    try {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data.settings;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un paramètre global spécifique (admin uniquement)
   * @param {string} category - Catégorie du paramètre (registration, storage, security)
   * @param {string} setting - Nom du paramètre
   * @param {any} value - Valeur du paramètre
   * @returns {Promise} Promesse résolue avec les paramètres mis à jour
   */
  async updateSetting(category, setting, value) {
    try {
      // D'abord, récupérer tous les paramètres actuels
      const currentSettings = await this.getSettings();
      
      // Créer une copie profonde pour éviter les problèmes de référence
      const updatedSettings = JSON.parse(JSON.stringify(currentSettings));
      
      // Mettre à jour le paramètre spécifique
      if (!updatedSettings[category]) {
        updatedSettings[category] = {};
      }
      
      updatedSettings[category][setting] = value;
      
      // Envoyer la mise à jour
      return await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du paramètre ${category}.${setting}:`, error);
      throw error;
    }
  }
};

export default adminService;