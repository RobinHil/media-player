import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import mediaService from '../api/mediaService';
import MediaGrid from '../components/media/MediaGrid';
import PageHeader from '../components/common/PageHeader';

/**
 * Page de résultats de recherche
 * @returns {JSX.Element} Page de recherche
 */
const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Récupérer le terme de recherche des paramètres d'URL
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') || '';
  
  // Récupérer les résultats de recherche avec React Query
  const { 
    data: searchResults, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery(
    ['searchResults', searchQuery, activeFilter], 
    () => mediaService.searchFiles(searchQuery, activeFilter), 
    {
      enabled: !!searchQuery,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Mettre à jour les résultats lorsque la requête change
  useEffect(() => {
    if (searchQuery) {
      refetch();
    }
  }, [searchQuery, activeFilter, refetch]);
  
  // Gérer le clic sur un élément
  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      navigate(`/browse?path=${encodeURIComponent(item.path)}`);
    } else {
      navigate(`/view/${item.type}/${encodeURIComponent(item.path)}`);
    }
  };
  
  // Gérer le changement de filtre
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
  
  // Filtrer les résultats par type
  const getFilteredResults = () => {
    if (!searchResults) return { files: [], folders: [] };
    
    if (activeFilter === 'all') {
      return searchResults;
    }
    
    return {
      ...searchResults,
      files: searchResults.files.filter(file => file.type === activeFilter)
    };
  };
  
  // Si aucune recherche
  if (!searchQuery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Recherche" />
        
        <div className="mt-8 bg-gray-50 dark:bg-dark-700 p-8 rounded-lg text-center">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune recherche</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Utilisez la barre de recherche pour trouver vos médias.
          </p>
        </div>
      </div>
    );
  }
  
  // Si chargement
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={`Recherche : "${searchQuery}"`} />
        
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
        <PageHeader title={`Recherche : "${searchQuery}"`} />
        
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
                Erreur lors de la recherche
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
  
  const filteredResults = getFilteredResults();
  const totalResults = (filteredResults.files?.length || 0) + (filteredResults.folders?.length || 0);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title={`Recherche : "${searchQuery}"`} subtitle={`${totalResults} résultat${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`}>
        {/* Filtres et options d'affichage */}
        <div className="flex space-x-2">
          {/* Filtres par type */}
          <div className="hidden md:flex rounded-md shadow-sm mr-4">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                activeFilter === 'all' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleFilterChange('all')}
            >
              Tous
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                activeFilter === 'video' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleFilterChange('video')}
            >
              Vidéos
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                activeFilter === 'audio' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleFilterChange('audio')}
            >
              Audio
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
                activeFilter === 'image' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleFilterChange('image')}
            >
              Images
            </button>
          </div>
          
          {/* Options d'affichage */}
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
        </div>
      </PageHeader>
      
      {/* Filtres pour mobile */}
      <div className="md:hidden mt-4 flex overflow-x-auto pb-2 space-x-2">
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeFilter === 'all' 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
              : 'bg-white text-gray-700 border border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
          }`}
          onClick={() => handleFilterChange('all')}
        >
          Tous
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeFilter === 'video' 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
              : 'bg-white text-gray-700 border border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
          }`}
          onClick={() => handleFilterChange('video')}
        >
          Vidéos
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeFilter === 'audio' 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
              : 'bg-white text-gray-700 border border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
          }`}
          onClick={() => handleFilterChange('audio')}
        >
          Audio
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeFilter === 'image' 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
              : 'bg-white text-gray-700 border border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
          }`}
          onClick={() => handleFilterChange('image')}
        >
          Images
        </button>
      </div>
      
      {/* Contenu principal */}
      <div className="mt-6">
        {/* Dossiers */}
        {filteredResults.folders && filteredResults.folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dossiers</h2>
            <MediaGrid 
              items={filteredResults.folders} 
              viewMode={viewMode} 
              onItemClick={handleItemClick} 
            />
          </div>
        )}
        
        {/* Fichiers */}
        {filteredResults.files && filteredResults.files.length > 0 ? (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fichiers</h2>
            <MediaGrid 
              items={filteredResults.files} 
              viewMode={viewMode} 
              onItemClick={handleItemClick} 
            />
          </div>
        ) : (
          totalResults === 0 && (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun résultat</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Aucun résultat trouvé pour "{searchQuery}". Essayez avec d'autres termes.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Search;