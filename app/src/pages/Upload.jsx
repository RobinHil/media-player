import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import mediaService from '../api/mediaService';
import PageHeader from '../components/common/PageHeader';
import config from '../config';

/**
 * Page d'importation de fichiers
 * @returns {JSX.Element} Page d'importation
 */
const Upload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [destination, setDestination] = useState('');
  
  // Extraire le chemin de destination des paramètres d'URL
  const queryParams = new URLSearchParams(location.search);
  const destPath = queryParams.get('path') || '';
  
  // Mutation pour l'importation de fichiers
  const uploadMutation = useMutation(
    (formData) => mediaService.uploadFiles(formData, destination || destPath, updateProgress),
    {
      onSuccess: (data) => {
        setSuccessCount(prevCount => prevCount + 1);
        
        // Si tous les fichiers ont été uploadés
        if (successCount + 1 >= files.length) {
          setTimeout(() => {
            // Rediriger vers le dossier de destination ou l'accueil
            if (destination || destPath) {
              navigate(`/browse?path=${encodeURIComponent(destination || destPath)}`);
            } else {
              navigate('/');
            }
          }, 1500);
        }
      },
      onError: (err) => {
        setError(err.message || 'Erreur lors de l\'importation des fichiers');
        setUploading(false);
      }
    }
  );
  
  // Mettre à jour la progression de l'importation
  const updateProgress = (file, progress) => {
    setUploadProgress(prev => ({
      ...prev,
      [file.name]: progress
    }));
  };
  
  // Gérer la sélection de fichiers
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError('');
    setUploadProgress({});
  };
  
  // Ouvrir la boîte de dialogue de sélection de fichiers
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  // Gérer le glisser-déposer
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Gérer le dépôt de fichiers
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setError('');
    setUploadProgress({});
  };
  
  // Démarrer l'importation
  const handleUpload = async () => {
    if (!files.length) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }
    
    setUploading(true);
    setSuccessCount(0);
    
    try {
      // Vérifier si les fichiers sont supportés
      const allSupportedFormats = [
        ...config.media.supportedVideoFormats,
        ...config.media.supportedImageFormats,
        ...config.media.supportedAudioFormats
      ];
      
      const unsupportedFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return !allSupportedFormats.includes(extension);
      });
      
      if (unsupportedFiles.length > 0) {
        setError(`${unsupportedFiles.length} fichier(s) non supporté(s): ${unsupportedFiles.map(f => f.name).join(', ')}`);
        setUploading(false);
        return;
      }
      
      // Envoyer chaque fichier individuellement
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        uploadMutation.mutate(formData);
      }
    } catch (err) {
      console.error('Erreur lors de l\'importation:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'importation');
      setUploading(false);
    }
  };
  
  // Calculer la progression globale
  const calculateTotalProgress = () => {
    if (!files.length) return 0;
    
    const totalProgress = files.reduce((acc, file) => {
      return acc + (uploadProgress[file.name] || 0);
    }, 0);
    
    return Math.round(totalProgress / files.length);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Importer des médias" subtitle="Importez des vidéos, images et audios dans votre médiathèque" />
      
      <div className="mt-6 bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Zone de dépôt de fichiers */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 dark:hover:border-dark-500 transition-colors"
            onClick={handleBrowseClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept={[
                ...config.media.supportedVideoFormats,
                ...config.media.supportedImageFormats,
                ...config.media.supportedAudioFormats
              ].join(',')}
            />
            
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Cliquez pour parcourir ou déposez vos fichiers ici
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Formats supportés: {config.media.supportedVideoFormats.join(', ')}, {config.media.supportedImageFormats.join(', ')}, {config.media.supportedAudioFormats.join(', ')}
            </p>
          </div>
          
          {/* Liste des fichiers sélectionnés */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Fichiers sélectionnés ({files.length})
              </h3>
              <ul className="mt-2 border border-gray-200 dark:border-dark-600 rounded-md divide-y divide-gray-200 dark:divide-dark-600">
                {files.map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {uploadProgress[file.name] ? (
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {uploadProgress[file.name]}%
                        </span>
                      ) : (
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Sélection du dossier de destination */}
          <div className="mt-6">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dossier de destination (optionnel)
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="destination"
                id="destination"
                className="form-input"
                placeholder="Chemin du dossier (ex: /photos/vacances)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={uploading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Laissez vide pour importer dans le dossier racine
            </p>
          </div>
          
          {/* Affichage des erreurs */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
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
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton d'importation */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !files.length}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importation en cours ({calculateTotalProgress()}%)
                </>
              ) : (
                <>
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
                  Importer {files.length} fichier{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={uploading}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;