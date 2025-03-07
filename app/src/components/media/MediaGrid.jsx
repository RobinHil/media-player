import React from 'react';
import { Link } from 'react-router-dom';
import MediaItem from './MediaItem';

/**
 * Grille d'affichage des médias
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de grille
 */
const MediaGrid = ({ items = [], loading = false, onItemClick }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-dark-600 rounded-lg aspect-video"></div>
            <div className="mt-2 h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4"></div>
            <div className="mt-1 h-3 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Aucun média trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <MediaItem 
          key={`${item.path}-${index}`} 
          item={item} 
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        />
      ))}
    </div>
  );
};

export default MediaGrid;