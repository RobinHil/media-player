import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import mediaService from '../api/mediaService';
import MediaGrid from '../components/media/MediaGrid';
import PageHeader from '../components/common/PageHeader';

/**
 * Page des favoris
 * @returns {JSX.Element} Page des favoris
 */
const Favorites = () => {
  const [viewMode, setViewMode] = useState('grid');
  
  // Récupérer les favoris avec React Query
  const { 
    data: favorites, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(['favorites'], () => mediaService.getFavorites(), {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Traiter les favoris pour affichage
  const getFavoritesItems = () => {
    if (!favorites) return [];
    
    const items = [];
    
    // Ajouter les fichiers favoris
    if (favorites.files && Array.isArray(favorites.files)) {
      items.push(...favorites.files);
    }
    
    // Ajouter les dossiers favoris
    if (favorites.folders && Array.isArray(favorites.folders)) {
      items.push(...favorites.folders);
    }
    
    return items;
  };
  
  // Si chargement
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Favoris" />
        
        <div className="animate-pulse mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-dark-600 aspect-video rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Si erreur
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Favoris" />
        
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 p-4 rounded-md border-l-4 border-red-500">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur lors du chargement des favoris
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error?.message || "Une erreur s'est produite. Veuillez réessayer."}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => refetch()}
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const favoriteItems = getFavoritesItems();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Favoris" subtitle="Vos médias et dossiers favoris">
        {/* Actions et options */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'grid' 
                ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
            }`}
            onClick={() => setViewMode('grid')}
            aria-label="Affichage en grille"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
              viewMode === 'list' 
                ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
            }`}
            onClick={() => setViewMode('list')}
            aria-label="Affichage en liste"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </PageHeader>
      
      {/* Contenu principal */}
      <div className="mt-6">
        {favoriteItems.length > 0 ? (
          <MediaGrid items={favoriteItems} viewMode={viewMode} />
        ) : (
          <div className="text-center py-12 bg-white dark:bg-dark-700 rounded-lg shadow">
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun favori</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vous n'avez pas encore ajouté d'éléments à vos favoris.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;