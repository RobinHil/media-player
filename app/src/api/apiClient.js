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
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `${config.auth?.tokenType || 'Bearer'} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables pour gérer le rafraîchissement du token
let isRefreshing = false;
let failedQueue = [];

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
      if (isRefreshing) {
        // Si le rafraîchissement est déjà en cours, mettre la requête en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `${config.auth.tokenType} ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('Aucun token de rafraîchissement disponible');
        }
        
        // Appeler l'API pour rafraîchir le token
        const response = await axios.post(`${config.apiBaseUrl}/auth/refresh-token`, {
          refreshToken
        });
        
        const { token, refreshToken: newRefreshToken, expiresIn } = response.data;
        
        if (token) {
          // Stocker les nouveaux tokens
          const success = setTokens(token, newRefreshToken, expiresIn);
          
          if (!success) {
            throw new Error('Échec du stockage des tokens');
          }
          
          // Mettre à jour le header d'autorisation
          apiClient.defaults.headers.common['Authorization'] = `${config.auth.tokenType} ${token}`;
          originalRequest.headers.Authorization = `${config.auth.tokenType} ${token}`;
          
          // Traiter la file d'attente avec le nouveau token
          processQueue(null, token);
          
          // Réessayer la requête originale
          return apiClient(originalRequest);
        } else {
          throw new Error('Échec du rafraîchissement du token');
        }
      } catch (refreshError) {
        // Gérer l'échec du rafraîchissement
        processQueue(refreshError, null);
        
        // Nettoyer les tokens et rediriger vers la page de connexion
        clearTokens();
        
        // Ne pas rediriger automatiquement car cela peut provoquer des boucles
        // Au lieu de cela, laissons le ProtectedRoute s'en occuper
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Gestion des autres erreurs...
    return Promise.reject(error);
  }
);

export default apiClient;