import React, { useState, useRef, useEffect } from 'react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';

/**
 * Composant de lecteur audio
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de lecteur audio
 */
const AudioPlayer = ({ src, title, thumbnail }) => {
  const playerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Configuration du lecteur
  const plyrOptions = {
    controls: [
      'play-large', // Le gros bouton de lecture au centre
      'play', // Bouton de lecture
      'progress', // Barre de progression
      'current-time', // Temps actuel
      'duration', // Durée totale
      'mute', // Bouton de sourdine
      'volume', // Contrôle du volume
      'settings', // Bouton de paramètres
      'fullscreen', // Bouton plein écran
    ],
    i18n: {
      restart: 'Redémarrer',
      rewind: 'Reculer {seektime}s',
      play: 'Lecture',
      pause: 'Pause',
      fastForward: 'Avancer {seektime}s',
      seek: 'Chercher',
      seekLabel: '{currentTime} sur {duration}',
      played: 'Lu',
      buffered: 'Mis en mémoire tampon',
      currentTime: 'Temps actuel',
      duration: 'Durée',
      volume: 'Volume',
      mute: 'Couper le son',
      unmute: 'Activer le son',
      download: 'Télécharger',
      enterFullscreen: 'Plein écran',
      exitFullscreen: 'Quitter le plein écran',
      frameTitle: 'Lecteur pour {title}',
      settings: 'Paramètres',
      menuBack: 'Retour au menu précédent',
      speed: 'Vitesse',
      normal: 'Normale',
      loop: 'Boucle',
      start: 'Début',
      end: 'Fin',
      all: 'Tout',
      reset: 'Réinitialiser',
      disabled: 'Désactivé',
      enabled: 'Activé',
      advertisement: 'Publicité',
    }
  };
  
  // Effet pour gérer le chargement initial
  useEffect(() => {
    if (src) {
      setIsLoaded(true);
    }
  }, [src]);
  
  // Si pas de source audio
  if (!src) {
    return (
      <div className="flex items-center justify-center bg-gray-800 h-36 rounded-lg">
        <p className="text-white">Aucune source audio disponible</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-dark-700 rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row">
        {/* Pochette / Thumbnail */}
        <div className="w-full md:w-1/3">
          <div className="aspect-square bg-gray-800 relative">
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-20 w-20 text-gray-400 dark:text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" 
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Lecteur et informations */}
        <div className="w-full md:w-2/3 p-4 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
          
          {/* Lecteur audio */}
          <div className="mt-auto">
            {isLoaded && (
              <Plyr
                ref={playerRef}
                source={{
                  type: 'audio',
                  title: title,
                  sources: [
                    {
                      src: src,
                      type: 'audio/mp3' // Ou determiner dynamiquement en fonction de l'extension
                    }
                  ]
                }}
                options={plyrOptions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;