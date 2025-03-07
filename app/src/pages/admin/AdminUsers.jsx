import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../api/userService';
import PageHeader from '../../components/common/PageHeader';

/**
 * Page de gestion des utilisateurs (Admin)
 * @returns {JSX.Element} Page d'administration des utilisateurs
 */
const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // État du formulaire pour ajouter/modifier un utilisateur
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    storageQuota: '5'
  });
  
  // Récupérer la liste des utilisateurs avec React Query
  const { 
    data: users, 
    isLoading, 
    isError,
    error
  } = useQuery(['users'], () => userService.getAllUsers());
  
  // Mutations pour les opérations CRUD
  const createUserMutation = useMutation(
    (userData) => userService.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        setShowAddModal(false);
        resetForm();
      }
    }
  );
  
  const updateUserMutation = useMutation(
    (userData) => userService.updateUser(userData.id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        setShowEditModal(false);
        setSelectedUser(null);
      }
    }
  );
  
  const deleteUserMutation = useMutation(
    (userId) => userService.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    }
  );
  
  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
      storageQuota: '5'
    });
  };
  
  // Gérer les changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Ouvrir le modal d'édition avec les données de l'utilisateur
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      storageQuota: (user.storageQuota / 1024 / 1024 / 1024).toString()
    });
    setShowEditModal(true);
  };
  
  // Ouvrir le modal de suppression
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };
  
  // Soumettre le formulaire d'ajout
  const handleAddSubmit = (e) => {
    e.preventDefault();
    
    // Conversion des Go en octets pour le quota
    const userData = {
      ...formData,
      storageQuota: parseInt(formData.storageQuota) * 1024 * 1024 * 1024
    };
    
    createUserMutation.mutate(userData);
  };
  
  // Soumettre le formulaire d'édition
  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    // Préparation des données
    const userData = {
      id: selectedUser._id,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      storageQuota: parseInt(formData.storageQuota) * 1024 * 1024 * 1024
    };
    
    // Ajouter le mot de passe seulement s'il est spécifié
    if (formData.password.trim()) {
      userData.password = formData.password;
    }
    
    updateUserMutation.mutate(userData);
  };
  
  // Confirmer la suppression
  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser._id);
    }
  };
  
  // Filtrer les utilisateurs par la recherche
  const filteredUsers = searchQuery && users 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  // Formater la taille
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Gestion des utilisateurs" subtitle="Ajouter, modifier ou supprimer des utilisateurs">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Ajouter un utilisateur
        </button>
      </PageHeader>
      
      {/* Barre de recherche */}
      <div className="mt-6">
        <div className="relative max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="form-input pl-10 pr-4 py-2 w-full"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Liste des utilisateurs */}
      <div className="mt-6 bg-white dark:bg-dark-700 shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <svg
              className="animate-spin mx-auto h-8 w-8 text-gray-500 dark:text-gray-400"
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Chargement des utilisateurs...
            </p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error?.message || "Une erreur est survenue lors du chargement des utilisateurs"}
            </p>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries(['users'])}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Réessayer
            </button>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Espace utilisé
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-dark-600">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                          : user.role === 'editor'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              (user.storageUsed / user.storageQuota) > 0.9 
                                ? 'bg-red-500' 
                                : (user.storageUsed / user.storageQuota) > 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((user.storageUsed / user.storageQuota) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {formatSize(user.storageUsed)} / {formatSize(user.storageQuota)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucun utilisateur trouvé
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'La liste des utilisateurs est vide.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout d'utilisateur */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddSubmit}>
                <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Ajouter un utilisateur
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="form-label">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="form-label">
                        Adresse e-mail
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="form-label">
                        Rôle
                      </label>
                      <select
                        name="role"
                        id="role"
                        className="form-input"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="password" className="form-label">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        className="form-input"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="storageQuota" className="form-label">
                        Quota de stockage (Go)
                      </label>
                      <input
                        type="number"
                        name="storageQuota"
                        id="storageQuota"
                        className="form-input"
                        min="1"
                        value={formData.storageQuota}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'édition d'utilisateur */}
      {showEditModal && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditSubmit}>
                <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Modifier l'utilisateur
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="form-label">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="edit-name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="form-label">
                        Adresse e-mail
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="edit-email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-role" className="form-label">
                        Rôle
                      </label>
                      <select
                        name="role"
                        id="edit-role"
                        className="form-input"
                        value={formData.role}
                        onChange={handleChange}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-password" className="form-label">
                        Nouveau mot de passe (laisser vide pour conserver l'actuel)
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="edit-password"
                        className="form-input"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-storageQuota" className="form-label">
                        Quota de stockage (Go)
                      </label>
                      <input
                        type="number"
                        name="storageQuota"
                        id="edit-storageQuota"
                        className="form-input"
                        min="1"
                        value={formData.storageQuota}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation de suppression */}
      {showDeleteModal && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Supprimer l'utilisateur
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</span> ? Cette action est irréversible et supprimera toutes les données associées à cet utilisateur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;