import React from 'react';

/**
 * Composant pour afficher les informations détaillées d'un média
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant d'informations média
 */
const MediaInfo = ({ info, type, path }) => {
  // Formater la taille en format lisible
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  
  // Formater la durée en format lisible
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      `${secs}s`
    ].filter(Boolean).join(' ');
  };
  
  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Rendre les métadonnées spécifiques au type de média
  const renderTypeSpecificInfo = () => {
    switch (type) {
      case 'video':
        return (
          <>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Résolution</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.width && info.height ? `${info.width} × ${info.height}` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Durée</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {formatDuration(info.duration)}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Codec</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.codec || 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Débit</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.bitrate ? `${Math.round(info.bitrate / 1000)} kbps` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Framerate</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.fps ? `${info.fps} FPS` : 'N/A'}
              </dd>
            </div>
          </>
        );
      case 'audio':
        return (
          <>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Durée</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {formatDuration(info.duration)}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Codec</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.codec || 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Débit</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.bitrate ? `${Math.round(info.bitrate / 1000)} kbps` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux d'échantillonnage</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.sampleRate ? `${info.sampleRate} Hz` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Canaux</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.channels ? (info.channels === 1 ? 'Mono' : info.channels === 2 ? 'Stéréo' : `${info.channels} canaux`) : 'N/A'}
              </dd>
            </div>
          </>
        );
      case 'image':
        return (
          <>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.width && info.height ? `${info.width} × ${info.height}` : 'N/A'}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {info.format || 'N/A'}
              </dd>
            </div>
            {info.colorSpace && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Espace colorimétrique</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {info.colorSpace}
                </dd>
              </div>
            )}
            {info.dpi && (
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Résolution</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {`${info.dpi} DPI`}
                </dd>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="overflow-hidden">
      <dl className="divide-y divide-gray-200 dark:divide-dark-600">
        {/* Informations générales */}
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom du fichier</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 break-all">
            {path.split('/').pop() || 'N/A'}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Chemin</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 break-all">
            {path || 'N/A'}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            {type.charAt(0).toUpperCase() + type.slice(1) || 'N/A'}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Taille</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            {formatFileSize(info.size)}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            {formatDate(info.created)}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de modification</dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
            {formatDate(info.modified)}
          </dd>
        </div>
        
        {/* Métadonnées spécifiques au type */}
        {renderTypeSpecificInfo()}
        
        {/* Métadonnées additionnelles */}
        {info.metadata && Object.keys(info.metadata).length > 0 && (
          <>
            <div className="py-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Métadonnées additionnelles</h3>
            </div>
            {Object.entries(info.metadata).map(([key, value]) => (
              <div key={key} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </>
        )}
      </dl>
    </div>
  );
};

export default MediaInfo;