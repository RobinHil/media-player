import { jwtDecode } from 'jwt-decode';
import config from '../config';

/**
 * Stocke les tokens d'authentification
 * @param {string} token - Token d'accès JWT
 * @param {string} refreshToken - Token de rafraîchissement
 * @param {number} expiresIn - Durée de validité en secondes
 */
export const setTokens = (token, refreshToken, expiresIn) => {
  if (!token || !refreshToken) {
    return false;
  }
  
  try {
    // Calculer la date d'expiration
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    
    // Stocker les tokens
    localStorage.setItem(config.auth.tokenStorageKey, token);
    localStorage.setItem(config.auth.refreshTokenStorageKey, refreshToken);
    localStorage.setItem(config.auth.tokenExpiryKey, expiryDate.getTime().toString());
    
    return true;
  } catch (error) {
    console.error('Erreur lors du stockage des tokens:', error);
    return false;
  }
};

/**
 * Récupère le token d'accès stocké
 * @returns {string|null} Token d'accès ou null s'il n'existe pas
 */
export const getToken = () => {
  try {
    return localStorage.getItem(config.auth.tokenStorageKey);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Récupère le token de rafraîchissement stocké
 * @returns {string|null} Token de rafraîchissement ou null s'il n'existe pas
 */
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(config.auth.refreshTokenStorageKey);
  } catch (error) {
    console.error('Erreur lors de la récupération du refresh token:', error);
    return null;
  }
};

/**
 * Supprime tous les tokens stockés
 */
export const clearTokens = () => {
  try {
    localStorage.removeItem(config.auth.tokenStorageKey);
    localStorage.removeItem(config.auth.refreshTokenStorageKey);
    localStorage.removeItem(config.auth.tokenExpiryKey);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression des tokens:', error);
    return false;
  }
};

/**
 * Vérifie si le token est valide et non expiré
 * @returns {boolean} True si le token est valide et non expiré
 */
export const isTokenValid = () => {
  try {
    const token = getToken();
    if (!token) {
      return false;
    }
    
    // Vérifier l'expiration stockée
    const expiryTime = localStorage.getItem(config.auth.tokenExpiryKey);
    if (!expiryTime) {
      return false;
    }
    
    const expiryDate = parseInt(expiryTime, 10);
    if (isNaN(expiryDate) || expiryDate <= Date.now()) {
      return false;
    }
    
    // Vérifier la validité du token (format JWT)
    try {
      const decoded = jwtDecode(token);
      return !!decoded;
    } catch (e) {
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
};

/**
 * Décode le token JWT pour récupérer les informations utilisateur
 * @returns {Object|null} Payload du token ou null si invalide
 */
export const getTokenInfo = () => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }
    
    return jwtDecode(token);
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur actuel a un rôle spécifique
 * @param {string|Array} roles - Rôle(s) à vérifier
 * @returns {boolean} True si l'utilisateur a le rôle spécifié
 */
export const hasRole = (roles) => {
  try {
    const tokenInfo = getTokenInfo();
    if (!tokenInfo || !tokenInfo.role) {
      return false;
    }
    
    // Si roles est une chaîne unique, la convertir en tableau
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    
    return rolesToCheck.includes(tokenInfo.role);
  } catch (error) {
    console.error('Erreur lors de la vérification des rôles:', error);
    return false;
  }
};

/**
 * Vérifie si le token doit être rafraîchi bientôt
 * @returns {boolean} True si le token doit être rafraîchi
 */
export const shouldRefreshToken = () => {
  try {
    // Vérifier l'expiration stockée
    const expiryTime = localStorage.getItem(config.auth.tokenExpiryKey);
    if (!expiryTime) {
      return false;
    }
    
    const expiryDate = parseInt(expiryTime, 10);
    if (isNaN(expiryDate)) {
      return false;
    }
    
    // Vérifier si l'expiration est proche (dans les prochaines N minutes)
    return expiryDate - Date.now() < config.security.refreshBeforeExpiry;
  } catch (error) {
    console.error('Erreur lors de la vérification du rafraîchissement:', error);
    return false;
  }
};