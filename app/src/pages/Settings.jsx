import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import config from '../config';
import userService from '../api/userService';
import PageHeader from '../components/common/PageHeader';

/**
 * Page de paramètres de l'application
 * @returns {JSX.Element} Page de paramètres
 */
const Settings = () => {
  const { theme, changeTheme, themes } = useTheme();
  const queryClient = useQueryClient();
  
  // Préférences utilisateur
  const [preferences, setPreferences] = useState({
    language: config.ui.defaultLanguage,
    defaultView: config.ui.defaultView,
    itemsPerPage: config.ui.itemsPerPage,
    autoplay: false
  });
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Récupérer les préférences utilisateur
  const { 
    data: userPreferences, 
    isLoading: preferencesLoading 
  } = useQuery(['userPreferences'], () => userService.getPreferences(), {
    onSuccess: (data) => {
      if (data) {
        setPreferences({
          language: data.language || config.ui.defaultLanguage,
          defaultView: data.defaultView || config.ui.defaultView,
          itemsPerPage: data.itemsPerPage || config.ui.itemsPerPage,
          autoplay: data.autoplay || false
        });
      }
    },
    onError: () => {
      // Utiliser les valeurs par défaut en cas d'erreur
    }
  });
  
  // Mutation pour mettre à jour les préférences
  const updatePreferencesMutation = useMutation(
    (preferences) => userService.updatePreferences(preferences),
    {
      onSuccess: () => {
        setSuccess('Vos préférences ont été mises à jour');
        queryClient.invalidateQueries(['userPreferences']);
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (err) => {
        setError(err.message || 'Une erreur est survenue lors de la mise à jour des préférences');
      }
    }
  );
  
  // Gérer le changement de thème
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };
  
  // Gérer les changements de préférences
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Enregistrer les modifications de préférences
  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    updatePreferencesMutation.mutate(preferences);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Paramètres" subtitle="Personnalisez votre expérience" />
      
      <div className="mt-6 max-w-4xl mx-auto">
        {/* Préférences de thème */}
        <div className="bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-dark-600">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Apparence
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Personnalisez l'apparence de l'application
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <label className="form-label">Thème</label>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div 
                  className={`
                    relative h-24 rounded-lg border-2 p-4 flex flex-col items-center justify-center text-center cursor-pointer
                    ${theme === themes.LIGHT ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600'}
                  `}
                  onClick={() => handleThemeChange(themes.LIGHT)}
                >
                  <svg className="h-6 w-6 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Clair</span>
                </div>
                
                <div 
                  className={`
                    relative h-24 rounded-lg border-2 p-4 flex flex-col items-center justify-center text-center cursor-pointer 
                    ${theme === themes.DARK ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600'}
                  `}
                  onClick={() => handleThemeChange(themes.DARK)}
                >
                  <svg className="h-6 w-6 text-gray-900 dark:text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sombre</span>
                </div>
                
                <div 
                  className={`
                    relative h-24 rounded-lg border-2 p-4 flex flex-col items-center justify-center text-center cursor-pointer 
                    ${theme === themes.SYSTEM ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-dark-600'}
                  `}
                  onClick={() => handleThemeChange(themes.SYSTEM)}
                >
                  <svg className="h-6 w-6 text-gray-900 dark:text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Système</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Préférences utilisateur */}
        <div className="bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-dark-600">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Préférences
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Personnalisez votre expérience utilisateur
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {/* Message de succès */}
            {success && (
              <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Formulaire de préférences */}
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div>
                <label htmlFor="language" className="form-label">Langue</label>
                <div className="mt-1">
                  <select
                    id="language"
                    name="language"
                    className="form-input"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                    disabled={preferencesLoading || updatePreferencesMutation.isLoading}
                  >
                    {config.ui.supportedLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang === 'fr' ? 'Français' : 'English'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="defaultView" className="form-label">Mode d'affichage par défaut</label>
                <div className="mt-1">
                  <select
                    id="defaultView"
                    name="defaultView"
                    className="form-input"
                    value={preferences.defaultView}
                    onChange={handlePreferenceChange}
                    disabled={preferencesLoading || updatePreferencesMutation.isLoading}
                  >
                    <option value="grid">Grille</option>
                    <option value="list">Liste</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="itemsPerPage" className="form-label">Éléments par page</label>
                <div className="mt-1">
                  <select
                    id="itemsPerPage"
                    name="itemsPerPage"
                    className="form-input"
                    value={preferences.itemsPerPage}
                    onChange={handlePreferenceChange}
                    disabled={preferencesLoading || updatePreferencesMutation.isLoading}
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="autoplay"
                    name="autoplay"
                    type="checkbox"
                    checked={preferences.autoplay}
                    onChange={handlePreferenceChange}
                    disabled={preferencesLoading || updatePreferencesMutation.isLoading}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="autoplay" className="font-medium text-gray-700 dark:text-gray-300">Lecture automatique</label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Démarrer automatiquement la lecture des médias
                  </p>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={preferencesLoading || updatePreferencesMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePreferencesMutation.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer les préférences'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;