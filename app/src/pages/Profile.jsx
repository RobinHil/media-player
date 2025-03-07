import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import userService from '../api/userService';
import PageHeader from '../components/common/PageHeader';

/**
 * Page de profil utilisateur
 * @returns {JSX.Element} Page de profil
 */
const Profile = () => {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // États pour le formulaire de changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Récupérer le profil utilisateur
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isError: profileError 
  } = useQuery(['userProfile'], () => userService.getProfile(), {
    onSuccess: (data) => {
      // Pré-remplir le formulaire avec les données utilisateur
      setFormData({
        name: data.name || '',
        email: data.email || '',
      });
    }
  });
  
  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation(
    (profileData) => userService.updateProfile(profileData),
    {
      onSuccess: () => {
        setSuccess('Votre profil a été mis à jour avec succès');
        // Invalider le cache de l'utilisateur pour forcer le rechargement
        queryClient.invalidateQueries(['userProfile']);
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (err) => {
        setError(err.message || 'Une erreur est survenue lors de la mise à jour du profil');
      }
    }
  );
  
  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation(
    (passwordData) => userService.changePassword(passwordData.currentPassword, passwordData.newPassword),
    {
      onSuccess: () => {
        setPasswordSuccess('Votre mot de passe a été changé avec succès');
        // Réinitialiser le formulaire
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setPasswordSuccess(''), 3000);
      },
      onError: (err) => {
        setPasswordError(err.message || 'Une erreur est survenue lors du changement de mot de passe');
      }
    }
  );
  
  // Gérer les changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer les changements dans le formulaire de mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Soumettre le formulaire principal
  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    // Vérification des champs
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return;
    }
    
    // Envoyer la mise à jour
    updateProfileMutation.mutate(formData);
  };
  
  // Soumettre le formulaire de changement de mot de passe
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    
    // Vérification des champs
    if (!passwordData.currentPassword) {
      setPasswordError('Le mot de passe actuel est requis');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordError('Le nouveau mot de passe est requis');
      return;
    }
    
    // Vérifier la longueur du mot de passe
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    // Vérifier la confirmation du mot de passe
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Envoyer la demande de changement
    changePasswordMutation.mutate(passwordData);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Profil utilisateur" subtitle="Gérez vos informations personnelles" />
      
      <div className="mt-6 max-w-3xl mx-auto">
        {/* Section d'informations personnelles */}
        <div className="bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-dark-600">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Informations personnelles
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Modifiez vos informations de base
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
            
            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="form-label">
                  Nom complet
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    disabled={profileLoading || updateProfileMutation.isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="form-label">
                  Adresse e-mail
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    disabled={profileLoading || updateProfileMutation.isLoading || true} // Email non modifiable
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  L'adresse e-mail ne peut pas être modifiée
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={profileLoading || updateProfileMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mise à jour...
                    </>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Section de changement de mot de passe */}
        <div className="bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-dark-600">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Sécurité
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Modifiez votre mot de passe
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {/* Message de succès */}
            {passwordSuccess && (
              <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">{passwordSuccess}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message d'erreur */}
            {passwordError && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{passwordError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Formulaire */}
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="form-label">
                  Mot de passe actuel
                </label>
                <div className="mt-1">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    disabled={changePasswordMutation.isLoading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="form-label">
                  Nouveau mot de passe
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    disabled={changePasswordMutation.isLoading}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    disabled={changePasswordMutation.isLoading}
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changePasswordMutation.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Modification...
                    </>
                  ) : (
                    'Changer le mot de passe'
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

export default Profile;