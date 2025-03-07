import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import mediaService from '../../api/mediaService';
import MediaGrid from '../../components/media/MediaGrid';
import FolderGrid from '../../components/media/FolderGrid';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';

/**
 * Liste des médias avec filtrage par type
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Page de liste des médias
 */
const MediaList = ({ type = 'all', mode = 'list' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const path = queryParams.get('path') || '';
  
  // État du composant
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'size'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  // Titre de la page en fonction du type
  const getTitle = () => {
    if (mode === 'browse') {
      return 'Explorateur de fichiers';
    }
    
    switch (type) {
      case 'video':
        return 'Vidéos';
      case 'audio':
        return 'Audio';
      case 'image':
        return 'Images';
      default:
        return 'Tous les médias';
    }
  };

  // Récupérer les fichiers et dossiers avec React Query
  const { data, isLoading, isError, error, refetch } = useQuery(
    ['files', path, type],
    () => mediaService.getFiles(path, type),
    {
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Construire les chemins pour le fil d'Ariane
  const getBreadcrumbItems = () => {
    if (!path) {
      return [{ name: 'Accueil', path: '/' }];
    }
    
    const parts = path.split('/');
    const items = [{ name: 'Accueil', path: '/' }];
    
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        currentPath += `${currentPath ? '/' : ''}${parts[i]}`;
        items.push({
          name: parts[i],
          path: `/browse?path=${encodeURIComponent(currentPath)}`
        });
      }
    }
    
    return items;
  };
  
  // Trier les éléments
  const sortItems = (items) => {
    if (!items) return [];
    
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          // Si la date de modification existe
          if (a.modified && b.modified) {
            const dateA = new Date(a.modified);
            const dateB = new Date(b.modified);
            comparison = dateA - dateB;
          }
          break;
        case 'size':
          // Si la taille existe (les dossiers n'ont pas de taille)
          if (a.size !== undefined && b.size !== undefined) {
            comparison = a.size - b.size;
          } else if (a.size === undefined && b.size !== undefined) {
            // Dossiers en premier
            comparison = -1;
          } else if (a.size !== undefined && b.size === undefined) {
            comparison = 1;
          }
          break;
        default:
          comparison = 0;
      }
      
      // Inverser l'ordre si nécessaire
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  // Gestion des changements de tri
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Inverser l'ordre si on clique sur le même critère
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau critère, ordre ascendant par défaut
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };
  
  // Navigation dans les dossiers
  const handleFolderClick = (folderPath) => {
    navigate(`/browse?path=${encodeURIComponent(folderPath)}`);
  };
  
  // Vue du fichier
  const handleFileClick = (file) => {
    navigate(`/view/${file.type}/${encodeURIComponent(file.path)}`);
  };
  
  // Si chargement
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={getTitle()} />
        {mode === 'browse' && <Breadcrumb items={getBreadcrumbItems()} />}
        
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
        <PageHeader title={getTitle()} />
        {mode === 'browse' && <Breadcrumb items={getBreadcrumbItems()} />}
        
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
                Erreur lors du chargement des médias
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
  
  // Trier les dossiers et fichiers
  const sortedFolders = sortItems(data?.folders || []);
  const sortedFiles = sortItems(data?.files || []);
  
  // Vérifier s'il y a des éléments à afficher
  const hasContent = sortedFolders.length > 0 || sortedFiles.length > 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title={getTitle()}>
        {/* Actions de tri et de vue */}
        <div className="flex space-x-2">
          {/* Boutons de tri */}
          <div className="hidden md:flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                sortBy === 'name' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleSort('name')}
            >
              Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-t border-b ${
                sortBy === 'date' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleSort('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-r-md border ${
                sortBy === 'size' 
                  ? 'bg-primary-100 text-primary-700 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700' 
                  : 'bg-white text-gray-700 border-gray-300 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
              }`}
              onClick={() => handleSort('size')}
            >
              Taille {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          
          {/* Boutons de vue (grille/liste) */}
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
      
      {/* Fil d'Ariane pour le mode navigation */}
      {mode === 'browse' && <Breadcrumb items={getBreadcrumbItems()} />}
      
      {/* Contenu principal */}
      <div className="mt-6">
        {/* Dossiers */}
        {sortedFolders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dossiers</h2>
            <FolderGrid folders={sortedFolders} viewMode={viewMode} onFolderClick={handleFolderClick} />
          </div>
        )}
        
        {/* Fichiers */}
        {sortedFiles.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fichiers</h2>
            <MediaGrid items={sortedFiles} viewMode={viewMode} onItemClick={handleFileClick} />
          </div>
        )}
        
        {/* Message si aucun contenu */}
        {!hasContent && (
          <div className="text-center py-16 bg-gray-50 dark:bg-dark-700 rounded-lg">
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun élément</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {mode === 'browse' 
                ? 'Ce dossier est vide.' 
                : `Aucun fichier ${type !== 'all' ? type : ''} trouvé.`}
            </p>
            <div className="mt-6">
              <Link
                to="/upload"
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Importer des médias
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaList;