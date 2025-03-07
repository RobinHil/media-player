import apiClient from './apiClient';
import { setTokens, clearTokens } from '../utils/auth';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Connexion d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @param {boolean} rememberMe - Option pour se souvenir de l'utilisateur
   * @returns {Promise} Promesse résolue avec les données de l'utilisateur
   */
  async login(email, password, rememberMe = false) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe
      });
      
      const { token, refreshToken, expiresIn, user } = response.data;
      
      // Stocker les tokens
      setTokens(token, refreshToken, expiresIn);
      
      return user;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },
  
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise} Promesse résolue avec les données de l'utilisateur créé
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  },
  
  /**
   * Déconnexion de l'utilisateur
   * @returns {Promise} Promesse résolue après la déconnexion
   */
  async logout() {
    try {
      // Récupérer le refresh token avant de le supprimer
      const refreshToken = localStorage.getItem('media_vault_refresh_token');
      
      // Nettoyer les tokens côté client
      clearTokens();
      
      // Informer le serveur de la déconnexion
      await apiClient.post('/auth/logout', { refreshToken });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on nettoie les tokens côté client
      clearTokens();
      return true;
    }
  },
  
  /**
   * Récupérer les informations de l'utilisateur connecté
   * @returns {Promise} Promesse résolue avec les données de l'utilisateur
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations utilisateur:', error);
      throw error;
    }
  },
  
  /**
   * Demander la réinitialisation du mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise} Promesse résolue après l'envoi de la demande
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation du mot de passe:', error);
      throw error;
    }
  },
  
  /**
   * Réinitialiser le mot de passe
   * @param {string} token - Token de réinitialisation
   * @param {string} password - Nouveau mot de passe
   * @returns {Promise} Promesse résolue après la réinitialisation
   */
  async resetPassword(token, password) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  },
  
  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean} True si l'utilisateur est authentifié
   */
  isAuthenticated() {
    const token = localStorage.getItem('media_vault_token');
    const expiry = localStorage.getItem('media_vault_token_expiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    // Vérifier si le token n'est pas expiré
    return parseInt(expiry, 10) > Date.now();
  }
};

export default authService;