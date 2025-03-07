import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mediaService from '../../api/mediaService';

/**
 * Menu contextuel pour les éléments médias
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de menu
 */
const MediaItemMenu = ({ item, onClose }) => {
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Fermer le menu lorsque l'utilisateur clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await mediaService.toggleFavorite(
        item.path,
        item.type,
        !item.favorite
      );
      
      // Fermer le menu
      onClose();
      
      // Rafraîchir la page (dans une application réelle, nous utiliserions un état global)
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  };

  // Gérer l'ouverture du détail
  const handleViewDetails = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    let url;
    if (item.type === 'folder') {
      url = `/browse?path=${encodeURIComponent(item.path)}`;
    } else {
      url = `/view/${item.type}/${encodeURIComponent(item.path)}`;
    }
    
    navigate(url);
    onClose();
  };

  // Gérer l'ajout à une collection
  const handleAddToCollection = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    navigate(`/collections/add?path=${encodeURIComponent(item.path)}`);
    onClose();
  };

  // Gérer le partage
  const handleShare = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    navigate(`/share?path=${encodeURIComponent(item.path)}`);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="absolute top-8 left-0 z-10 w-56 mt-1 bg-white dark:bg-dark-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="options-menu"
    >
      <div className="py-1" role="none">
        <button
          onClick={handleToggleFavorite}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
          role="menuitem"
        >
          {item.favorite ? (
            <>
              <svg className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Retirer des favoris
            </>
          ) : (
            <>
              <svg className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Ajouter aux favoris
            </>
          )}
        </button>
        
        <button
          onClick={handleViewDetails}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
          role="menuitem"
        >
          <svg className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Voir les détails
        </button>
        
        <button
          onClick={handleAddToCollection}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
          role="menuitem"
        >
          <svg className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Ajouter à une collection
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
          role="menuitem"
        >
          <svg className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Partager
        </button>
      </div>
    </div>
  );
};

export default MediaItemMenu;