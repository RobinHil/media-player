import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../api/authService';
import { isTokenValid, hasRole, getTokenInfo, shouldRefreshToken, getRefreshToken } from '../utils/auth';
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
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Hooks de navigation
  const navigate = useNavigate();
  
  /**
   * Initialise l'état d'authentification au chargement
   */
  const initAuth = useCallback(async () => {
    if (authInitialized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier si un token valide existe
      if (isTokenValid()) {
        // Vérifier si le token doit être rafraîchi
        if (shouldRefreshToken()) {
          try {
            // Récupérer le refresh token
            const refreshToken = getRefreshToken();
            if (refreshToken) {
              // Appeler l'API pour rafraîchir le token
              await authService.refreshToken(refreshToken);
              // Si succès, les nouveaux tokens seront stockés par le service
            }
          } catch (refreshError) {
            console.error('Erreur lors du rafraîchissement automatique du token:', refreshError);
            // En cas d'échec du rafraîchissement, effacer les tokens et rediriger vers la connexion
            authService.logout();
            setUser(null);
            setAuthInitialized(true);
            setLoading(false);
            return;
          }
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
      setAuthInitialized(true);
      setLoading(false);
    }
  }, [authInitialized]);
  
  // Initialiser l'authentification au montage
  useEffect(() => {
    initAuth();
    
    // Ajouter un gestionnaire d'événements pour stocker l'état d'authentification entre les onglets
    const handleStorageChange = (e) => {
      if (e.key === 'auth_logout') {
        setUser(null);
      } else if (e.key === 'auth_login') {
        initAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Configurer un intervalle pour vérifier et rafraîchir le token
    const tokenRefreshInterval = setInterval(() => {
      if (isTokenValid() && shouldRefreshToken()) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          authService.refreshToken(refreshToken)
            .catch(error => {
              console.error('Erreur lors du rafraîchissement périodique du token:', error);
              // En cas d'erreur lors du rafraîchissement périodique, on ne déconnecte pas
              // l'utilisateur, on attendra la prochaine vérification
            });
        }
      }
    }, 4 * 60 * 1000); // Vérifier toutes les 4 minutes
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenRefreshInterval);
    };
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
      
      // Déclencher un événement pour synchroniser tous les onglets
      localStorage.setItem('auth_login', Date.now().toString());
      // Et le supprimer immédiatement (pour que l'événement soit toujours déclenché)
      localStorage.removeItem('auth_login');
      
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
      
      // Déclencher un événement pour synchroniser tous les onglets
      localStorage.setItem('auth_logout', Date.now().toString());
      // Et le supprimer immédiatement (pour que l'événement soit toujours déclenché)
      localStorage.removeItem('auth_logout');
      
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
    return isTokenValid();
  }, []);
  
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
    checkRole,
    authInitialized
  }), [user, loading, error, login, logout, register, initAuth, isAuthenticated, checkRole, authInitialized]);
  
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