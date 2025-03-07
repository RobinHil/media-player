import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import mediaService from '../../api/mediaService';
import VideoPlayer from '../../components/media/VideoPlayer';
import AudioPlayer from '../../components/media/AudioPlayer';
import ImageViewer from '../../components/media/ImageViewer';
import MediaInfo from '../../components/media/MediaInfo';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import MediaActions from '../../components/media/MediaActions';

/**
 * Page de détail d'un média
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Page de détail du média
 */
const MediaDetails = ({ shared = false }) => {
  const { type, path } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedFormat, setSelectedFormat] = useState('auto');
  const [showInfo, setShowInfo] = useState(false);
  
  // Extraire le token de partage des paramètres d'URL si en mode partagé
  const shareToken = shared ? new URLSearchParams(location.search).get('token') : null;
  
  // Décodage de l'URL
  const decodedPath = decodeURIComponent(path || '');
  
  // Récupérer les informations du média
  const { 
    data: mediaInfo, 
    isLoading: infoLoading, 
    isError: infoError,
    error: infoErrorDetails 
  } = useQuery(['mediaInfo', decodedPath], () => mediaService.getMediaInfo(decodedPath), {
    enabled: !!decodedPath,
    retry: 1,
  });
  
  // Récupérer les formats disponibles pour les vidéos
  const { 
    data: formats,
    isLoading: formatsLoading
  } = useQuery(['mediaFormats', decodedPath], () => mediaService.getAvailableFormats(decodedPath), {
    enabled: !!decodedPath && type === 'video',
    retry: 1,
  });
  
  // Récupérer les sous-titres pour les vidéos
  const { 
    data: subtitles 
  } = useQuery(['mediaSubtitles', decodedPath], () => mediaService.getSubtitles(decodedPath), {
    enabled: !!decodedPath && type === 'video',
    retry: 1,
  });
  
  // Construire les URLs des médias
  const getMediaURL = () => {
    if (!decodedPath) return '';
    
    if (shared && shareToken) {
      return `/api/shared/stream/${path}?token=${shareToken}&quality=${selectedQuality}&format=${selectedFormat}`;
    }
    
    return mediaService.getStreamUrl(decodedPath, selectedQuality, selectedFormat);
  };
  
  // Obtenir le nom du fichier
  const getFileName = () => {
    if (!decodedPath) return '';
    
    const parts = decodedPath.split('/');
    return parts[parts.length - 1];
  };
  
  // Construire les chemins pour le fil d'Ariane
  const getBreadcrumbItems = () => {
    if (!decodedPath) {
      return [{ name: 'Accueil', path: '/' }];
    }
    
    const parts = decodedPath.split('/');
    const fileName = parts.pop(); // Retirer le nom de fichier
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
    
    // Ajouter le nom du fichier (non cliquable)
    items.push({
      name: fileName,
      path: null
    });
    
    return items;
  };
  
  // Gérer les changements de qualité
  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
  };
  
  // Gérer les changements de format
  const handleFormatChange = (format) => {
    setSelectedFormat(format);
  };
  
  // Afficher/masquer les informations
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };
  
  // Partager le média
  const handleShare = () => {
    navigate(`/share?path=${encodeURIComponent(decodedPath)}`);
  };
  
  // Ajouter aux favoris
  const handleToggleFavorite = async (isFavorite) => {
    try {
      await mediaService.toggleFavorite(decodedPath, type, isFavorite);
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
    }
  };
  
  // Télécharger le fichier
  const handleDownload = () => {
    const url = getMediaURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Si chargement
  if (infoLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // Si erreur
  if (infoError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Erreur" />
        
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
                Erreur lors du chargement du média
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{infoErrorDetails?.message || "Ce média n'existe pas ou vous n'avez pas les droits pour y accéder."}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => navigate(-1)}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Déterminer le contenu en fonction du type
  const renderMediaContent = () => {
    const mediaURL = getMediaURL();
    
    switch (type) {
      case 'video':
        return (
          <VideoPlayer 
            src={mediaURL} 
            title={getFileName()}
            subtitles={subtitles?.subtitles}
            poster={mediaService.getThumbnailUrl(decodedPath, { time: 5 })}
            formats={formats?.formats}
            onQualityChange={handleQualityChange}
            onFormatChange={handleFormatChange}
          />
        );
      case 'audio':
        return (
          <AudioPlayer 
            src={mediaURL} 
            title={getFileName()}
            thumbnail={mediaService.getThumbnailUrl(decodedPath)}
          />
        );
      case 'image':
        return (
          <ImageViewer 
            src={mediaURL} 
            alt={getFileName()}
          />
        );
      default:
        return (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Type de fichier non pris en charge</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ce type de fichier ne peut pas être affiché dans le navigateur.
            </p>
            <div className="mt-6">
              <button
                onClick={handleDownload}
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Télécharger
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title={getFileName()}>
        <div className="flex space-x-2">
          <button
            type="button"
            className={`p-2 rounded-md ${
              showInfo 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                : 'bg-white text-gray-700 dark:bg-dark-700 dark:text-gray-300'
            } border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
            onClick={toggleInfo}
            aria-label="Informations"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <MediaActions 
            mediaType={type}
            mediaPath={decodedPath}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
            onDownload={handleDownload}
          />
        </div>
      </PageHeader>
      
      {/* Fil d'Ariane */}
      <Breadcrumb items={getBreadcrumbItems()} />
      
      {/* Contenu principal */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lecteur ou visualiseur */}
        <div className={`${showInfo ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-dark-700 rounded-lg shadow-sm overflow-hidden`}>
          {renderMediaContent()}
        </div>
        
        {/* Informations sur le média */}
        {showInfo && (
          <div className="bg-white dark:bg-dark-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations</h2>
              <MediaInfo 
                info={mediaInfo?.metadata || {}} 
                type={type} 
                path={decodedPath} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaDetails;