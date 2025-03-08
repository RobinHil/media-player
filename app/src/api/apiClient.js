import axios from 'axios';
import config from '../config';
import { getToken, clearTokens, getRefreshToken, setTokens } from '../utils/auth';

// Créer une instance Axios avec la configuration de base
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Envoyer les cookies avec chaque requête
});

// Intercepteur de requêtes pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  async (reqConfig) => {
    const token = getToken();
    if (token) {
      reqConfig.headers.Authorization = `${config.auth.tokenType} ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Variables pour gérer le rafraîchissement du token
let isRefreshing = false;
let failedQueue = [];
let refreshPromise = null;

// Fonction pour traiter la file d'attente des requêtes échouées
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Fonction pour rafraîchir le token
const refreshAuthToken = async () => {
  // Si un rafraîchissement est déjà en cours, retourner la promesse existante
  if (refreshPromise) {
    return refreshPromise;
  }
  
  // Créer une nouvelle promesse pour le rafraîchissement
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('Aucun token de rafraîchissement disponible');
      }
      
      // Appeler l'API pour rafraîchir le token sans utiliser l'instance apiClient
      // pour éviter les boucles d'intercepteurs
      const response = await axios.post(`${config.apiBaseUrl}/auth/refresh-token`, {
        refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      const { token, refreshToken: newRefreshToken, expiresIn } = response.data;
      
      if (token) {
        // Stocker les nouveaux tokens
        const success = setTokens(token, newRefreshToken, expiresIn);
        
        if (!success) {
          throw new Error('Échec du stockage des tokens');
        }
        
        // Résoudre la promesse avec le nouveau token
        resolve(token);
      } else {
        throw new Error('Échec du rafraîchissement du token');
      }
    } catch (error) {
      reject(error);
    } finally {
      // Réinitialiser la promesse de rafraîchissement
      refreshPromise = null;
    }
  });
  
  return refreshPromise;
};

// Intercepteur de réponses pour gérer les erreurs et le rafraîchissement du token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si le serveur n'est pas disponible ou autre erreur réseau
    if (!error.response) {
      return Promise.reject(new Error('Le serveur n\'est pas accessible. Veuillez vérifier votre connexion.'));
    }
    
    // Si le token est expiré et que nous n'avons pas déjà essayé de rafraîchir
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Si le rafraîchissement est déjà en cours
      if (isRefreshing) {
        // Mettre la requête en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `${config.auth.tokenType} ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            // Si la file d'attente échoue, effacer les tokens et retourner l'erreur
            clearTokens();
            return Promise.reject(err);
          });
      }
      
      isRefreshing = true;
      
      try {
        // Rafraîchir le token
        const newToken = await refreshAuthToken();
        
        // Mettre à jour le header d'autorisation
        apiClient.defaults.headers.common['Authorization'] = `${config.auth.tokenType} ${newToken}`;
        originalRequest.headers.Authorization = `${config.auth.tokenType} ${newToken}`;
        
        // Traiter la file d'attente avec le nouveau token
        processQueue(null, newToken);
        
        // Réessayer la requête originale
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Gérer l'échec du rafraîchissement
        console.error('Erreur de rafraîchissement du token:', refreshError);
        
        // Traiter la file d'attente avec l'erreur
        processQueue(refreshError, null);
        
        // Nettoyer les tokens
        clearTokens();
        
        // Ne pas rediriger automatiquement car cela peut provoquer des boucles
        // Au lieu de cela, laissons le ProtectedRoute s'en occuper
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Formater les messages d'erreur pour l'utilisateur
    if (error.response && error.response.data) {
      const serverError = error.response.data.message || error.response.data.error || 'Une erreur est survenue';
      return Promise.reject(new Error(serverError));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;