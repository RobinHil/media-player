import React from 'react';

/**
 * Grille d'affichage des dossiers
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant de grille de dossiers
 */
const FolderGrid = ({ folders = [], viewMode = 'grid', onFolderClick }) => {
  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };
  
  // Si aucun dossier
  if (folders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Aucun dossier</p>
      </div>
    );
  }
  
  // Si mode liste
  if (viewMode === 'list') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
          <thead className="bg-gray-50 dark:bg-dark-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date de modification
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-700 divide-y divide-gray-200 dark:divide-dark-600">
            {folders.map((folder, index) => (
              <tr 
                key={`${folder.path}-${index}`}
                className="hover:bg-gray-50 dark:hover:bg-dark-600 cursor-pointer"
                onClick={() => onFolderClick(folder.path)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center text-yellow-500 dark:text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(folder.modified)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFolderClick(folder.path);
                    }}
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Mode grille (par défaut)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {folders.map((folder, index) => (
        <div
          key={`${folder.path}-${index}`}
          className="bg-white dark:bg-dark-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-dark-600 hover:shadow-md hover:border-gray-300 dark:hover:border-dark-500 cursor-pointer transition-all duration-200"
          onClick={() => onFolderClick(folder.path)}
        >
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 flex items-center justify-center text-yellow-500 dark:text-yellow-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-2" title={folder.name}>
              {folder.name}
            </h3>
            {folder.modified && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(folder.modified)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FolderGrid;