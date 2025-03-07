import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import SearchBar from '../common/SearchBar';

/**
 * En-tête de l'application
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant d'en-tête
 */
const Header = ({ toggleSidebar, isSidebarOpen, user }) => {
  const { logout } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Fermer le menu utilisateur lorsque l'utilisateur clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gérer le basculement du menu utilisateur
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  // Gérer la déconnexion
  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };
  
  return (
    <header className="bg-white dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 z-10 transition-colors duration-200">
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Bouton de sidebar et logo */}
        <div className="flex items-center">
          <button
            type="button"
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Fermer la barre latérale" : "Ouvrir la barre latérale"}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          
          {/* Logo - visible uniquement en petit écran ou quand la sidebar est fermée */}
          <div className={`ml-4 ${isSidebarOpen ? 'md:hidden' : ''}`}>
            <Link to="/" className="flex items-center space-x-2">
              <svg
                className="h-8 w-8 text-primary-600 dark:text-primary-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h18M3 16h18"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">MediaVault</span>
            </Link>
          </div>
        </div>
        
        {/* Zone de recherche */}
        <div className="hidden md:block flex-1 max-w-2xl mx-4">
          <SearchBar />
        </div>
        
        {/* Actions utilisateur */}
        <div className="flex items-center space-x-4">
          {/* Bouton de thème */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={toggleTheme}
            aria-label={isDarkTheme ? "Activer le thème clair" : "Activer le thème sombre"}
          >
            {isDarkTheme ? (
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          
          {/* Menu utilisateur */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex items-center space-x-2 focus:outline-none"
              onClick={toggleUserMenu}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || "Utilisateur"}
              </span>
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-dark-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="block px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-600">
                  Connecté en tant que <span className="font-medium">{user?.email}</span>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Profil
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Paramètres
                </Link>
                <button
                  type="button"
                  className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-600"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Barre de recherche mobile */}
      <div className="md:hidden px-4 py-2">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;