import React, { useState, useEffect } from 'react';
import mediaService from '../../api/mediaService';

/**
 * Barre d'actions pour les médias (favoris, partage, téléchargement)
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant d'actions média
 */
const MediaActions = ({ mediaType, mediaPath, onToggleFavorite, onShare, onDownload }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Vérifier si le média est en favoris
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        // Dans une application réelle, nous aurions une API dédiée pour vérifier cela
        // Ici, nous simulons en récupérant tous les favoris et en vérifiant si notre média est dedans
        const favorites = await mediaService.getFavorites();
        
        // Vérifier si le fichier est dans les favoris
        if (favorites.files && Array.isArray(favorites.files)) {
          const isFileFavorite = favorites.files.some(file => file.path === mediaPath);
          if (isFileFavorite) {
            setIsFavorite(true);
            return;
          }
        }
        
        // Vérifier si le dossier est dans les favoris
        if (favorites.folders && Array.isArray(favorites.folders)) {
          const isFolderFavorite = favorites.folders.some(folder => folder.path === mediaPath);
          if (isFolderFavorite) {
            setIsFavorite(true);
            return;
          }
        }
        
        setIsFavorite(false);
      } catch (error) {
        console.error('Erreur lors de la vérification des favoris:', error);
      }
    };
    
    if (mediaPath) {
      checkFavorite();
    }
  }, [mediaPath]);
  
  // Gérer le toggle des favoris
  const handleToggleFavorite = async () => {
    try {
      await mediaService.toggleFavorite(mediaPath, mediaType, !isFavorite);
      setIsFavorite(!isFavorite);
      
      // Appeler le callback si fourni
      if (onToggleFavorite) {
        onToggleFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  };
  
  return (
    <div className="flex space-x-2">
      {/* Bouton Favoris */}
      <button
        type="button"
        className={`p-2 rounded-md ${
          isFavorite 
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' 
            : 'bg-white text-gray-700 dark:bg-dark-700 dark:text-gray-300'
        } border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
        onClick={handleToggleFavorite}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {isFavorite ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
      </button>
      
      {/* Bouton Partager */}
      <button
        type="button"
        className="p-2 rounded-md bg-white text-gray-700 dark:bg-dark-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        onClick={onShare}
        aria-label="Partager"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      
      {/* Bouton Télécharger */}
      <button
        type="button"
        className="p-2 rounded-md bg-white text-gray-700 dark:bg-dark-700 dark:text-gray-300 border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        onClick={onDownload}
        aria-label="Télécharger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
};

export default MediaActions;