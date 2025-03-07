import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../api/authService';
import { isTokenValid, hasRole, getTokenInfo, shouldRefreshToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

// Créer le contexte
export const AuthContext = createContext();

/**
 * Fournisseur du contexte d'authentification
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant fournisseur
 */
export const AuthProvider = ({ children }) => {
  // État de l'utilisateur
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hooks de navigation
  const navigate = useNavigate();
  
  /**
   * Initialise l'état d'authentification au chargement
   */
  const initAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier si un token valide existe
      if (isTokenValid()) {
        // Vérifier si le token doit être rafraîchi
        if (shouldRefreshToken()) {
          // Rafraîchir le token en arrière-plan (géré par les intercepteurs)
          // Pas besoin de code ici car c'est géré automatiquement par apiClient
        }
        
        // Récupérer les infos utilisateur
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de l\'authentification:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initialiser l'authentification au montage
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @param {boolean} rememberMe - Option pour se souvenir de l'utilisateur
   * @returns {Promise<Object>} Utilisateur connecté
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.login(email, password, rememberMe);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message || 'Échec de la connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Déconnecte l'utilisateur
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  
  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur inscrit
   */
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message || 'Échec de l\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {string|Array} roles - Rôle(s) à vérifier
   * @returns {boolean} True si l'utilisateur a le rôle
   */
  const checkRole = useCallback((roles) => {
    return hasRole(roles);
  }, []);
  
  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} True si l'utilisateur est authentifié
   */
  const isAuthenticated = useCallback(() => {
    return !!user && isTokenValid();
  }, [user]);
  
  // Valeur du contexte
  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    register,
    initAuth,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isEditor: user?.role === 'editor' || user?.role === 'admin',
    checkRole
  }), [user, loading, error, login, logout, register, initAuth, isAuthenticated, checkRole]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @returns {Object} Contexte d'authentification
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};