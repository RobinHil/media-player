import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Barre de recherche globale
 * @returns {JSX.Element} Composant de barre de recherche
 */
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Récupérer les recherches récentes au chargement
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
      } catch (error) {
        console.error('Erreur lors de la récupération des recherches récentes:', error);
      }
    }
  }, []);
  
  // Fermer les suggestions lorsque l'utilisateur clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Sauvegarder dans les recherches récentes
    const newSearches = [
      query,
      ...recentSearches.filter(search => search !== query)
    ].slice(0, 5);
    
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    
    // Rediriger vers la page de résultats de recherche
    navigate(`/search?q=${encodeURIComponent(query)}`);
    
    // Réinitialiser l'état actif
    setIsActive(false);
  };
  
  // Sélectionner une recherche récente
  const selectRecentSearch = (search) => {
    setQuery(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setIsActive(false);
  };
  
  // Effacer une recherche récente
  const clearRecentSearch = (e, search) => {
    e.stopPropagation();
    
    const newSearches = recentSearches.filter(item => item !== search);
    setRecentSearches(newSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newSearches));
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            placeholder="Rechercher des médias..."
            className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-dark-500 rounded-md 
                       bg-white dark:bg-dark-600 text-gray-900 dark:text-gray-200 
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Rechercher"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {query && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
            >
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>
      
      {/* Suggestions et recherches récentes */}
      {isActive && (recentSearches.length > 0 || query) && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-md shadow-lg">
          {/* Recherches récentes */}
          {recentSearches.length > 0 && !query && (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Recherches récentes
              </h3>
              <ul>
                {recentSearches.map((search, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-md"
                      onClick={() => selectRecentSearch(search)}
                    >
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{search}</span>
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        onClick={(e) => clearRecentSearch(e, search)}
                        aria-label="Supprimer cette recherche"
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Résultats de recherche (à implémenter avec une recherche en temps réel) */}
          {query && (
            <div className="p-2">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                Appuyez sur Entrée pour rechercher{' '}
                <span className="font-semibold">"{query}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;