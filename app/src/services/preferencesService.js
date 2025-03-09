import apiClient from '../api/apiClient';

/**
 * Service de gestion des préférences utilisateur
 */
const preferencesService = {
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
   * @param {string} preferences.language - Langue de l'interface
   * @param {string} preferences.defaultView - Vue par défaut (grid, list)
   * @param {number} preferences.itemsPerPage - Nombre d'éléments par page
   * @param {boolean} preferences.autoplay - Lecture automatique
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
  
  /**
   * Met à jour une seule préférence
   * @param {string} key - Clé de la préférence
   * @param {any} value - Valeur de la préférence
   * @returns {Promise} Promesse résolue avec les préférences mises à jour
   */
  async updateSinglePreference(key, value) {
    try {
      // D'abord, récupérer toutes les préférences actuelles
      const currentPrefs = await this.getPreferences();
      
      // Mettre à jour la préférence spécifique
      const updatedPrefs = {
        ...currentPrefs,
        [key]: value
      };
      
      // Envoyer la mise à jour
      return await this.updatePreferences(updatedPrefs);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la préférence ${key}:`, error);
      throw error;
    }
  },
  
  /**
   * Réinitialise les préférences aux valeurs par défaut
   * @returns {Promise} Promesse résolue avec les préférences par défaut
   */
  async resetPreferencesToDefault() {
    try {
      // Les valeurs par défaut telles que définies dans la configuration
      const defaultPreferences = {
        language: 'fr',
        defaultView: 'grid',
        itemsPerPage: 50,
        autoplay: false
      };
      
      // Mettre à jour avec les valeurs par défaut
      return await this.updatePreferences(defaultPreferences);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
      throw error;
    }
  }
};

export default preferencesService;