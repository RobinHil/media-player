import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../api/userService';
import config from '../../config';
import PageHeader from '../../components/common/PageHeader';

/**
 * Page de paramètres globaux (Admin)
 * @returns {JSX.Element} Page d'administration des paramètres
 */
const AdminSettings = () => {
  const queryClient = useQueryClient();
  
  // État pour les paramètres du système
  const [systemSettings, setSystemSettings] = useState({
    maxUploadSize: config.media.chunkSize * 100, // 100MB par défaut
    defaultStorageQuota: 5 * 1024 * 1024 * 1024, // 5GB par défaut
    sessionTimeout: config.security.sessionTimeout / (1000 * 60), // Convertir en minutes
    enableAutoConversion: true,
    enablePublicSharing: true,
    enableUserRegistration: true,
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    smtpFromEmail: '',
  });
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Récupérer les paramètres systèmes actuels
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError
  } = useQuery(['systemSettings'], () => userService.getSystemSettings(), {
    onSuccess: (data) => {
      if (data) {
        setSystemSettings({
          maxUploadSize: data.maxUploadSize || config.media.chunkSize * 100,
          defaultStorageQuota: data.defaultStorageQuota || 5 * 1024 * 1024 * 1024,
          sessionTimeout: data.sessionTimeout / (1000 * 60) || config.security.sessionTimeout / (1000 * 60),
          enableAutoConversion: data.enableAutoConversion !== undefined ? data.enableAutoConversion : true,
          enablePublicSharing: data.enablePublicSharing !== undefined ? data.enablePublicSharing : true,
          enableUserRegistration: data.enableUserRegistration !== undefined ? data.enableUserRegistration : true,
          smtpEnabled: data.smtpEnabled || false,
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword ? '******' : '',
          smtpSecure: data.smtpSecure || false,
          smtpFromEmail: data.smtpFromEmail || '',
        });
      }
    }
  });
  
  // Mutation pour mettre à jour les paramètres
  const updateSettingsMutation = useMutation(
    (settingsData) => userService.updateSystemSettings(settingsData),
    {
      onSuccess: () => {
        setSuccess('Les paramètres ont été mis à jour avec succès');
        queryClient.invalidateQueries(['systemSettings']);
        // Effacer le message après quelques secondes
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (err) => {
        setError(err.message || 'Une erreur est survenue lors de la mise à jour des paramètres');
        // Effacer le message après quelques secondes
        setTimeout(() => setError(''), 5000);
      }
    }
  );
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : 
               value
    }));
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Préparer les données à envoyer
    const formattedSettings = {
      ...systemSettings,
      sessionTimeout: systemSettings.sessionTimeout * 60 * 1000, // Convertir en millisecondes
    };
    
    // Ne pas envoyer le mot de passe SMTP s'il n'a pas été modifié
    if (formattedSettings.smtpPassword === '******') {
      delete formattedSettings.smtpPassword;
    }
    
    // Envoyer les paramètres
    updateSettingsMutation.mutate(formattedSettings);
  };
  
  // Formater la taille en Mo
  const formatMegabytes = (bytes) => {
    return Math.round(bytes / (1024 * 1024));
  };
  
  // Formater la taille en Go
  const formatGigabytes = (bytes) => {
    return Math.round(bytes / (1024 * 1024 * 1024));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Paramètres système" subtitle="Configuration globale de l'application" />
      
      <div className="mt-6 max-w-6xl mx-auto">
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
        
        {/* Formulaire des paramètres */}
        <form onSubmit={handleSubmit}>
          <div className="shadow sm:rounded-md">
            {/* Paramètres généraux */}
            <div className="bg-white dark:bg-dark-700 px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Paramètres généraux</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configuration générale du système.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="maxUploadSize" className="form-label">
                    Taille maximale d'import (Mo)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="maxUploadSize"
                      id="maxUploadSize"
                      min="1"
                      className="form-input"
                      value={formatMegabytes(systemSettings.maxUploadSize)}
                      onChange={(e) => {
                        const mbValue = Number(e.target.value);
                        setSystemSettings(prev => ({
                          ...prev,
                          maxUploadSize: mbValue * 1024 * 1024
                        }));
                      }}
                      disabled={settingsLoading || updateSettingsMutation.isLoading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Taille maximale des fichiers importés en une seule fois.
                  </p>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="defaultStorageQuota" className="form-label">
                    Quota de stockage par défaut (Go)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="defaultStorageQuota"
                      id="defaultStorageQuota"
                      min="1"
                      className="form-input"
                      value={formatGigabytes(systemSettings.defaultStorageQuota)}
                      onChange={(e) => {
                        const gbValue = Number(e.target.value);
                        setSystemSettings(prev => ({
                          ...prev,
                          defaultStorageQuota: gbValue * 1024 * 1024 * 1024
                        }));
                      }}
                      disabled={settingsLoading || updateSettingsMutation.isLoading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Quota de stockage attribué par défaut aux nouveaux utilisateurs.
                  </p>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="sessionTimeout" className="form-label">
                    Délai d'expiration de session (minutes)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="sessionTimeout"
                      id="sessionTimeout"
                      min="5"
                      className="form-input"
                      value={systemSettings.sessionTimeout}
                      onChange={handleChange}
                      disabled={settingsLoading || updateSettingsMutation.isLoading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Durée d'inactivité avant expiration de la session.
                  </p>
                </div>
                
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableAutoConversion"
                        name="enableAutoConversion"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                        checked={systemSettings.enableAutoConversion}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="enableAutoConversion" className="font-medium text-gray-700 dark:text-gray-300">
                        Activer la conversion automatique des médias
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Convertir automatiquement les vidéos et images dans des formats optimisés pour le web.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enablePublicSharing"
                        name="enablePublicSharing"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                        checked={systemSettings.enablePublicSharing}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="enablePublicSharing" className="font-medium text-gray-700 dark:text-gray-300">
                        Autoriser le partage public
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Permettre aux utilisateurs de partager des médias via des liens publics.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableUserRegistration"
                        name="enableUserRegistration"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                        checked={systemSettings.enableUserRegistration}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="enableUserRegistration" className="font-medium text-gray-700 dark:text-gray-300">
                        Autoriser l'inscription des utilisateurs
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Permettre aux nouveaux utilisateurs de s'inscrire directement sur la plateforme.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Paramètres SMTP */}
            <div className="bg-gray-50 dark:bg-dark-800 px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Configuration SMTP</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Paramètres pour l'envoi d'emails (récupération de mot de passe, notifications, etc.).
              </p>
              
              <div className="mt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="smtpEnabled"
                      name="smtpEnabled"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                      checked={systemSettings.smtpEnabled}
                      onChange={handleChange}
                      disabled={settingsLoading || updateSettingsMutation.isLoading}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="smtpEnabled" className="font-medium text-gray-700 dark:text-gray-300">
                      Activer l'envoi d'emails
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Configurer les paramètres SMTP pour permettre l'envoi d'emails depuis l'application.
                    </p>
                  </div>
                </div>
              </div>
              
              {systemSettings.smtpEnabled && (
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpHost" className="form-label">
                      Serveur SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpHost"
                        id="smtpHost"
                        className="form-input"
                        value={systemSettings.smtpHost}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                        required={systemSettings.smtpEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpPort" className="form-label">
                      Port SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="smtpPort"
                        id="smtpPort"
                        className="form-input"
                        value={systemSettings.smtpPort}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                        required={systemSettings.smtpEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpUser" className="form-label">
                      Nom d'utilisateur SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpUser"
                        id="smtpUser"
                        className="form-input"
                        value={systemSettings.smtpUser}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                        required={systemSettings.smtpEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpPassword" className="form-label">
                      Mot de passe SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        name="smtpPassword"
                        id="smtpPassword"
                        className="form-input"
                        value={systemSettings.smtpPassword}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                        placeholder={settings?.smtpPassword ? "Conserver le mot de passe actuel" : ""}
                        required={systemSettings.smtpEnabled && !settings?.smtpPassword}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpFromEmail" className="form-label">
                      Email d'expéditeur
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="smtpFromEmail"
                        id="smtpFromEmail"
                        className="form-input"
                        value={systemSettings.smtpFromEmail}
                        onChange={handleChange}
                        disabled={settingsLoading || updateSettingsMutation.isLoading}
                        required={systemSettings.smtpEnabled}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-5">
                        <input
                          id="smtpSecure"
                          name="smtpSecure"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
                          checked={systemSettings.smtpSecure}
                          onChange={handleChange}
                          disabled={settingsLoading || updateSettingsMutation.isLoading}
                        />
                      </div>
                      <div className="ml-3 text-sm mt-5">
                        <label htmlFor="smtpSecure" className="font-medium text-gray-700 dark:text-gray-300">
                          Utiliser une connexion sécurisée (TLS/SSL)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 text-right sm:px-6 border-t border-gray-200 dark:border-dark-600">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={settingsLoading || updateSettingsMutation.isLoading}
              >
                {updateSettingsMutation.isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;