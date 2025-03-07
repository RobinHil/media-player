import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Affichage de l'activité récente
 * @returns {JSX.Element} Composant d'activité récente
 */
const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Charger les activités récentes
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Note: Dans une application réelle, nous ferions un appel API pour obtenir
        // l'historique d'activité. Ici, nous utilisons des données fictives pour la démonstration.
        
        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives d'activité
        const mockActivities = [
          {
            id: 1,
            type: 'upload',
            user: 'Vous',
            target: 'Video_vacances_2023.mp4',
            targetType: 'video',
            targetPath: '/video_vacances_2023.mp4',
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          },
          {
            id: 2,
            type: 'favorite',
            user: 'Vous',
            target: 'Paris.jpg',
            targetType: 'image',
            targetPath: '/photos/paris.jpg',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          },
          {
            id: 3,
            type: 'collection',
            user: 'Vous',
            target: 'Vacances 2023',
            targetType: 'collection',
            targetPath: '/collections/1',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
          },
          {
            id: 4,
            type: 'share',
            user: 'Vous',
            target: 'Concert.mp3',
            targetType: 'audio',
            targetPath: '/audio/concert.mp3',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          },
          {
            id: 5,
            type: 'view',
            user: 'Vous',
            target: 'Documentation.pdf',
            targetType: 'document',
            targetPath: '/documents/documentation.pdf',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // Formater la date relative
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    } else if (diffHour > 0) {
      return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
      return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  };
  
  // Obtenir l'icône en fonction du type d'activité
  const getActivityIcon = (activity) => {
    switch (activity.type) {
      case 'upload':
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        );
      case 'favorite':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case 'collection':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      case 'share':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
        );
      case 'view':
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  // Obtenir la description de l'activité
  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'upload':
        return (
          <>
            <span className="font-medium">{activity.user}</span> avez importé{' '}
            <Link to={`/view/${activity.targetType}/${activity.targetPath}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>
          </>
        );
      case 'favorite':
        return (
          <>
            <span className="font-medium">{activity.user}</span> avez ajouté{' '}
            <Link to={`/view/${activity.targetType}/${activity.targetPath}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>{' '}
            aux favoris
          </>
        );
      case 'collection':
        return (
          <>
            <span className="font-medium">{activity.user}</span> avez créé la collection{' '}
            <Link to={activity.targetPath} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>
          </>
        );
      case 'share':
        return (
          <>
            <span className="font-medium">{activity.user}</span> avez partagé{' '}
            <Link to={`/view/${activity.targetType}/${activity.targetPath}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>
          </>
        );
      case 'view':
        return (
          <>
            <span className="font-medium">{activity.user}</span> avez consulté{' '}
            <Link to={`/view/${activity.targetType}/${activity.targetPath}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>
          </>
        );
      default:
        return (
          <>
            <span className="font-medium">{activity.user}</span> a effectué une action sur{' '}
            <Link to={`/view/${activity.targetType}/${activity.targetPath}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
              {activity.target}
            </Link>
          </>
        );
    }
  };
  
  // UI pour le chargement
  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-700 shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-dark-600">
          {[...Array(3)].map((_, index) => (
            <li key={index} className="p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-600"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  // UI pour aucune activité
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-700 shadow rounded-lg p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Aucune activité récente</p>
      </div>
    );
  }
  
  // UI principale
  return (
    <div className="bg-white dark:bg-dark-700 shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-dark-600">
        {activities.map((activity) => (
          <li key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors duration-150">
            <div className="flex items-start space-x-4">
              {getActivityIcon(activity)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 text-center">
        <Link to="/activity" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
          Voir toute l'activité
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;