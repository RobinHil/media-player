import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Layout pour les pages d'authentification
 * @returns {JSX.Element} Composant de layout
 */
const AuthLayout = () => {
  const { isAuthenticated, loading, authInitialized, initAuth } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Initialiser l'authentification si nécessaire
  useEffect(() => {
    if (!authInitialized) {
      initAuth();
    }
  }, [authInitialized, initAuth]);
  
  // Si l'utilisateur est déjà authentifié, rediriger vers la page d'accueil
  useEffect(() => {
    if (!loading && authInitialized && isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [loading, authInitialized, isAuthenticated, navigate]);
  
  // Si en chargement, afficher un indicateur
  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${isDarkTheme ? 'dark' : ''}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <svg
              className="h-10 w-10 text-primary-600 dark:text-primary-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h18M3 16h18"
              />
            </svg>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">MediaVault</span>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          <Outlet context={{ title: true }} />
        </h2>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-dark-700 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet context={{ title: false }} />
        </div>
        
        {/* Basculer le thème */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-dark-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isDarkTheme ? (
              <>
                <svg
                  className="-ml-0.5 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Mode clair
              </>
            ) : (
              <>
                <svg
                  className="-ml-0.5 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Mode sombre
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;