import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import mediaService from '../../api/mediaService';
import MediaItemMenu from './MediaItemMenu';

/**
 * Élément média individuel dans une grille ou liste
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant d'élément média
 */
const MediaItem = ({ item, onClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  // S'assurer que l'élément existe
  if (!item) {
    return null;
  }

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Formater la date de modification
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  // Obtenir l'icône en fonction du type
  const getIcon = () => {
    switch (item.type) {
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'audio':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        );
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      case 'folder':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Déterminer l'URL de la miniature
  const getThumbnailUrl = () => {
    if (!item || !item.path) {
      return null;
    }
    
    if (item.thumbnail) {
      return item.thumbnail;
    }
    
    // Si c'est un dossier sans miniature, retourner null
    if (item.type === 'folder') {
      return null;
    }

    // Utiliser le service pour générer l'URL de la miniature
    return mediaService.getThumbnailUrl(item.path);
  };

  // Construire l'URL de détail pour les différents types
  const getDetailUrl = () => {
    if (!item || !item.path) {
      return '/';
    }
    
    if (item.type === 'folder') {
      return `/browse?path=${encodeURIComponent(item.path)}`;
    }
    return `/view/${item.type}/${encodeURIComponent(item.path)}`;
  };

  // Gestionnaire de clic sur le menu
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  // Gestionnaire de clic sur l'élément
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(item);
    }
  };

  // Contenu du composant
  const content = (
    <>
      {/* Miniature */}
      <div className="relative aspect-video bg-gray-100 dark:bg-dark-600 rounded-md overflow-hidden">
        {getThumbnailUrl() ? (
          <img
            src={getThumbnailUrl()}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className={`h-12 w-12 ${item.type === 'folder' ? 'text-yellow-500 dark:text-yellow-400' : ''}`}>
              {getIcon()}
            </div>
          </div>
        )}
        
        {/* Badges et indicateurs */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {item.favorite && (
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          )}
        </div>
        
        {/* Menu d'actions */}
        <div className="absolute top-2 left-2">
          <button
            onClick={handleMenuToggle}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showMenu && (
            <MediaItemMenu 
              item={item} 
              onClose={() => setShowMenu(false)} 
            />
          )}
        </div>
        
        {/* Type d'élément */}
        <div className="absolute bottom-2 left-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            ${item.type === 'video' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
            ${item.type === 'audio' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
            ${item.type === 'image' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            ${item.type === 'folder' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
          `}>
            <div className="mr-1.5 h-2 w-2">
              {getIcon()}
            </div>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Informations */}
      <div className="mt-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.name}>
          {item.name}
        </h3>
        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
          {item.type !== 'folder' && (
            <span className="mr-2">{formatFileSize(item.size)}</span>
          )}
          {item.modified && (
            <span>{formatDate(item.modified)}</span>
          )}
        </div>
      </div>
    </>
  );

  // Rendre le composant avec ou sans lien
  return onClick ? (
    <div className="group cursor-pointer" onClick={handleClick}>
      {content}
    </div>
  ) : (
    <Link to={getDetailUrl()} className="group block">
      {content}
    </Link>
  );
};

export default MediaItem;