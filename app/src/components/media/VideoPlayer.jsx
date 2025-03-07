import React, { useState, useRef, useEffect } from 'react';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';

/**
 * Composant de lecteur vidéo
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de lecteur vidéo
 */
const VideoPlayer = ({ 
  src, 
  title, 
  poster, 
  subtitles = [], 
  formats = [],
  onQualityChange,
  onFormatChange
}) => {
  const playerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [currentFormat, setCurrentFormat] = useState('auto');
  
  // Préparation des sous-titres pour Plyr
  const plyrSubtitles = subtitles.map(subtitle => ({
    kind: 'subtitles',
    src: subtitle.url,
    srcLang: subtitle.lang,
    label: subtitle.label,
    default: subtitle.lang === 'fr' // Par défaut le français si disponible
  }));
  
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
      'captions', // Bouton de sous-titres
      'settings', // Bouton de paramètres
      'pip', // Picture-in-Picture
      'airplay', // Support AirPlay
      'fullscreen', // Bouton plein écran
    ],
    quality: {
      default: 'auto'
    },
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
      enableCaptions: 'Activer les sous-titres',
      disableCaptions: 'Désactiver les sous-titres',
      download: 'Télécharger',
      enterFullscreen: 'Plein écran',
      exitFullscreen: 'Quitter le plein écran',
      frameTitle: 'Lecteur pour {title}',
      captions: 'Sous-titres',
      settings: 'Paramètres',
      menuBack: 'Retour au menu précédent',
      speed: 'Vitesse',
      normal: 'Normale',
      quality: 'Qualité',
      loop: 'Boucle',
      start: 'Début',
      end: 'Fin',
      all: 'Tout',
      reset: 'Réinitialiser',
      disabled: 'Désactivé',
      enabled: 'Activé',
      advertisement: 'Publicité',
      qualityLabel: {
        0: 'Auto',
      },
    }
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (quality) => {
    setCurrentQuality(quality);
    if (onQualityChange) {
      onQualityChange(quality);
    }
  };
  
  // Gérer le changement de format
  const handleFormatChange = (format) => {
    setCurrentFormat(format);
    if (onFormatChange) {
      onFormatChange(format);
    }
  };
  
  // Afficher les paramètres disponibles
  const renderSettings = () => {
    // Récupérer les différentes qualités disponibles pour le format actuel
    const availableQualities = formats
      .find(f => f.format === currentFormat)?.qualities || [];
    
    return (
      <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow absolute right-0 top-full mt-2 z-10 w-48">
        {/* Sélection du format */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Format
          </label>
          <select
            value={currentFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
            className="form-input text-sm"
          >
            <option value="auto">Auto</option>
            {formats.map((format, index) => (
              <option key={index} value={format.format}>
                {format.format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sélection de la qualité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Qualité
          </label>
          <select
            value={currentQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="form-input text-sm"
          >
            <option value="auto">Auto</option>
            {availableQualities.map((quality, index) => (
              <option key={index} value={quality.quality}>
                {quality.quality}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };
  
  // Effet pour gérer le chargement initial
  useEffect(() => {
    if (src) {
      setIsLoaded(true);
    }
  }, [src]);
  
  // Si pas de source vidéo
  if (!src) {
    return (
      <div className="flex items-center justify-center bg-gray-900 aspect-video rounded-lg">
        <p className="text-white">Aucune source vidéo disponible</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="aspect-video rounded-lg overflow-hidden">
        {isLoaded && (
          <Plyr
            ref={playerRef}
            source={{
              type: 'video',
              title: title,
              sources: [
                {
                  src: src,
                  type: currentFormat === 'mp4' ? 'video/mp4' : 
                        currentFormat === 'webm' ? 'video/webm' : 
                        currentFormat === 'hls' ? 'application/x-mpegURL' : 'video/mp4'
                }
              ],
              poster: poster,
              tracks: plyrSubtitles
            }}
            options={plyrOptions}
          />
        )}
      </div>
      
      {/* Bouton de paramètres personnalisés */}
      <div className="absolute top-2 right-2">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-70 focus:outline-none"
          aria-label="Options avancées"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* Panel des paramètres */}
        {showSettings && renderSettings()}
      </div>
      
      {/* Titre sous la vidéo */}
      <div className="mt-2 px-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      </div>
    </div>
  );
};

export default VideoPlayer;