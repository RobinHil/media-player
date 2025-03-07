import React, { useState, useRef, useEffect } from 'react';

/**
 * Composant de visualisation d'image
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de visualisation d'image
 */
const ImageViewer = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState(false);
  const imageRef = useRef(null);
  
  // Gérer le chargement de l'image
  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };
  
  // Gérer les erreurs de chargement
  const handleError = () => {
    setIsLoaded(true);
    setError(true);
  };
  
  // Gérer le zoom sur l'image
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };
  
  // Si pas de source image
  if (!src) {
    return (
      <div className="flex items-center justify-center bg-gray-200 dark:bg-dark-600 aspect-video rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Aucune image disponible</p>
      </div>
    );
  }
  
  return (
    <div className="relative bg-white dark:bg-dark-700 rounded-lg overflow-hidden shadow-sm">
      {/* Calque de chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-dark-600">
          <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="p-4 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Impossible de charger l'image</p>
        </div>
      )}
      
      {/* Container de l'image */}
      <div
        className={`relative ${isZoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in overflow-hidden'}`}
        style={{
          maxHeight: isZoomed ? '80vh' : 'unset',
          height: isZoomed ? '80vh' : 'auto'
        }}
        onClick={toggleZoom}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || "Image"}
          className={`w-full h-auto transition-transform duration-300 ${isZoomed ? 'scale-150 origin-top-left' : 'scale-100'}`}
          style={{ display: error ? 'none' : 'block' }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      
      {/* Contrôles */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{alt}</h3>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={toggleZoom}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none"
            aria-label={isZoomed ? "Réduire" : "Agrandir"}
          >
            {isZoomed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            )}
          </button>
          <a
            href={src}
            download={alt || "image"}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none"
            aria-label="Télécharger"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;