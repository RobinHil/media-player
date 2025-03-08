import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route protégée qui vérifie l'authentification
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de route
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authInitialized, initAuth } = useAuth();
  const location = useLocation();
  
  // Si l'authentification n'est pas encore initialisée, essayer de l'initialiser
  React.useEffect(() => {
    if (!authInitialized) {
      initAuth();
    }
  }, [authInitialized, initAuth]);
  
  // Pendant le chargement initial, afficher un indicateur de chargement
  if (loading || !authInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-dark-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // Si non authentifié, rediriger vers la page de connexion avec le chemin de retour
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Si authentifié, afficher le contenu protégé
  return children;
};

/**
 * Route d'administration qui vérifie le rôle admin
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de route
 */
export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, authInitialized, initAuth } = useAuth();
  const location = useLocation();
  
  // Si l'authentification n'est pas encore initialisée, essayer de l'initialiser
  React.useEffect(() => {
    if (!authInitialized) {
      initAuth();
    }
  }, [authInitialized, initAuth]);
  
  // Pendant le chargement, afficher un indicateur de chargement
  if (loading || !authInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-dark-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // Si non authentifié, rediriger vers la page de connexion
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Si authentifié mais pas admin, rediriger vers la page d'accueil
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Si admin, afficher le contenu d'administration
  return children;
};