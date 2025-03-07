import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import userService from '../../api/userService';
import PageHeader from '../../components/common/PageHeader';

/**
 * Page de journaux d'activité (Admin)
 * @returns {JSX.Element} Page des journaux d'activité
 */
const AdminLogs = () => {
  const [filter, setFilter] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    searchQuery: ''
  });
  
  // Récupérer les journaux d'activité
  const { 
    data: logs, 
    isLoading, 
    isError,
    error
  } = useQuery(['activityLogs', filter], () => userService.getActivityLogs(filter), {
    keepPreviousData: true
  });
  
  // Gérer les changements de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(date);
  };
  
  // Détecter la couleur et l'icône en fonction du type de log
  const getLogTypeStyle = (type) => {
    switch (type) {
      case 'login':
        return {
          color: 'text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'logout':
        return {
          color: 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.586 9H7a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'upload':
        return {
          color: 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v4m0 0l-2-2m2 2l2-2" />
            </svg>
          )
        };
      case 'delete':
        return {
          color: 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'share':
        return {
          color: 'text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.636l-4.94 2.47a3 3 0 100 4.337l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.854l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          )
        };
      default:
        return {
          color: 'text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/20',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Journaux d'activité" 
        subtitle="Suivez l'historique des actions des utilisateurs" 
      />
      
      {/* Filtres */}
      <div className="mt-6 bg-white dark:bg-dark-700 shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="type" className="form-label">Type d'activité</label>
            <select
              id="type"
              name="type"
              className="form-input"
              value={filter.type}
              onChange={handleFilterChange}
            >
              <option value="all">Tous les types</option>
              <option value="login">Connexions</option>
              <option value="logout">Déconnexions</option>
              <option value="upload">Importations</option>
              <option value="delete">Suppressions</option>
              <option value="share">Partages</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="form-label">Date de début</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className="form-input"
              value={filter.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="form-label">Date de fin</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              className="form-input"
              value={filter.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label htmlFor="searchQuery" className="form-label">Recherche</label>
            <input
              type="text"
              id="searchQuery"
              name="searchQuery"
              className="form-input"
              placeholder="Utilisateur, description..."
              value={filter.searchQuery}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
      
      {/* Liste des journaux */}
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
              Chargement des journaux...
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
              {error?.message || "Une erreur est survenue lors du chargement des journaux"}
            </p>
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date et heure
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Adresse IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
                {logs.map((log, index) => {
                  const logTypeStyle = getLogTypeStyle(log.type);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-600">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${logTypeStyle.color}`}>
                          {logTypeStyle.icon}
                          <span className="ml-1.5">
                            {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
                            {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.user?.name || 'Utilisateur inconnu'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {log.user?.email || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  );
                })}
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
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucun journal trouvé
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {Object.values(filter).some(val => val !== '' && val !== 'all') 
                ? 'Aucun résultat ne correspond à vos filtres.' 
                : 'Aucune activité enregistrée'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;