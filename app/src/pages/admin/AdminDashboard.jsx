import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import userService from '../../api/userService';
import PageHeader from '../../components/common/PageHeader';

/**
 * Tableau de bord d'administration
 * @returns {JSX.Element} Page d'administration
 */
const AdminDashboard = () => {
  // Récupérer les statistiques utilisateurs
  const { 
    data: usersStats, 
    isLoading: usersLoading 
  } = useQuery(['usersStats'], () => userService.getUsersStats());
  
  // Récupérer les statistiques de sessions
  const { 
    data: sessionsStats, 
    isLoading: sessionsLoading 
  } = useQuery(['sessionsStats'], () => userService.getSessionsStats());
  
  // Statistiques à afficher
  const stats = [
    {
      name: 'Utilisateurs',
      value: usersLoading ? '...' : usersStats?.totalUsers || 0,
      change: usersLoading ? '...' : usersStats?.newUsers || 0,
      changeType: 'increase',
      period: '30 derniers jours',
      icon: (
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/admin/users'
    },
    {
      name: 'Sessions actives',
      value: sessionsLoading ? '...' : sessionsStats?.activeSessions || 0,
      change: sessionsLoading ? '...' : sessionsStats?.sessionsChange || 0,
      changeType: sessionsLoading ? 'increase' : (sessionsStats?.sessionsChange || 0) >= 0 ? 'increase' : 'decrease',
      period: '24 dernières heures',
      icon: (
        <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      href: '/admin/sessions'
    },
    {
      name: 'Espace utilisé',
      value: usersLoading ? '...' : `${Math.round((usersStats?.totalStorage || 0) / 1024 / 1024 / 1024)} GB`,
      change: usersLoading ? '...' : `${Math.round((usersStats?.storageChange || 0) / 1024 / 1024)} MB`,
      changeType: usersLoading ? 'increase' : (usersStats?.storageChange || 0) >= 0 ? 'increase' : 'decrease',
      period: '7 derniers jours',
      icon: (
        <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      href: '/admin/storage'
    },
    {
      name: 'Fichiers partagés',
      value: usersLoading ? '...' : usersStats?.sharedFiles || 0,
      change: usersLoading ? '...' : usersStats?.newShares || 0,
      changeType: 'increase',
      period: '30 derniers jours',
      icon: (
        <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      href: '/admin/shares'
    }
  ];
  
  // Liens rapides
  const quickLinks = [
    {
      name: 'Gérer les utilisateurs',
      description: 'Ajouter, modifier ou supprimer des utilisateurs',
      icon: (
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/admin/users'
    },
    {
      name: 'Gérer les sessions',
      description: 'Surveiller et révoquer les sessions actives',
      icon: (
        <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      href: '/admin/sessions'
    },
    {
      name: 'Paramètres système',
      description: 'Configurer les paramètres globaux de l\'application',
      icon: (
        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/admin/settings'
    },
    {
      name: 'Journaux d\'activité',
      description: 'Consulter les journaux et diagnostiquer les problèmes',
      icon: (
        <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/admin/logs'
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Administration" subtitle="Bienvenue dans le panneau d'administration" />
      
      {/* Statistiques */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Statistiques</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative bg-white dark:bg-dark-700 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <div>
                <div className="absolute bg-gray-50 dark:bg-dark-800 rounded-md p-3">
                  {stat.icon}
                </div>
                <div className="ml-16 flex items-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="ml-2">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stat.changeType === 'increase' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {stat.changeType === 'increase' ? (
                        <svg className="-ml-1 mr-0.5 flex-shrink-0 h-4 w-4 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="-ml-1 mr-0.5 flex-shrink-0 h-4 w-4 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {stat.change}
                    </div>
                  </dd>
                </div>
              </div>
              <div className="ml-16 pb-2 flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  sur {stat.period}
                </p>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gray-50 dark:bg-dark-800 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to={stat.href} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                    Voir plus<span className="sr-only"> {stat.name}</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Liens rapides */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => (
            <div key={index} className="relative rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-dark-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
              <div className="flex-shrink-0">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={link.href} className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {link.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {link.description}
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;