import React, { useEffect, useState } from 'react';
import mediaService from '../../api/mediaService';

/**
 * Statistiques rapides pour le tableau de bord
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de statistiques
 */
const QuickStats = ({ collections = 0, favorites = 0 }) => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalAudios: 0,
    totalImages: 0,
    recentlyAdded: 0
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Dans une application réelle, nous aurions une API dédiée pour les statistiques
        // Ici, nous simulons en faisant des requêtes séparées
        
        // Récupérer tous les types de médias en parallèle pour être plus efficace
        const [videosResponse, audiosResponse, imagesResponse] = await Promise.all([
          mediaService.getFiles('', 'video'),
          mediaService.getFiles('', 'audio'),
          mediaService.getFiles('', 'image')
        ]);
        
        const totalVideos = videosResponse.files?.length || 0;
        const totalAudios = audiosResponse.files?.length || 0;
        const totalImages = imagesResponse.files?.length || 0;
        
        // Calculer le nombre d'éléments ajoutés récemment (7 derniers jours)
        const allFiles = [
          ...(videosResponse.files || []),
          ...(audiosResponse.files || []),
          ...(imagesResponse.files || [])
        ];
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentlyAdded = allFiles.filter(file => {
          if (!file.modified) return false;
          const modifiedDate = new Date(file.modified);
          return modifiedDate >= oneWeekAgo;
        }).length;
        
        setStats({
          totalVideos,
          totalAudios,
          totalImages,
          recentlyAdded
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Statistiques à afficher
  const statItems = [
    {
      name: 'Vidéos',
      value: stats.totalVideos,
      icon: (
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      href: '/media/videos'
    },
    {
      name: 'Audios',
      value: stats.totalAudios,
      icon: (
        <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      href: '/media/audio'
    },
    {
      name: 'Images',
      value: stats.totalImages,
      icon: (
        <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      href: '/media/images'
    },
    {
      name: 'Collections',
      value: collections,
      icon: (
        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
      href: '/collections'
    },
    {
      name: 'Favoris',
      value: favorites,
      icon: (
        <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      href: '/favorites'
    },
    {
      name: 'Ajoutés récemment',
      value: stats.recentlyAdded,
      icon: (
        <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
      href: '/recents'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item, index) => (
        <a
          key={index}
          href={item.href}
          className={`group p-4 rounded-lg ${item.bgClass} hover:bg-opacity-80 dark:hover:bg-opacity-50 transition-all duration-200`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">{item.icon}</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {item.name}
              </p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {loading ? (
                  <span className="inline-block h-8 w-12 bg-gray-200 dark:bg-dark-600 rounded animate-pulse"></span>
                ) : (
                  item.value
                )}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default QuickStats;