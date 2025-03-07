import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Layout principal de l'application
 * @returns {JSX.Element} Composant de layout
 */
const MainLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDarkTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Gérer l'ouverture/fermeture de la sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated()) {
    return <Outlet />;
  }
  
  return (
    <div className={`flex h-screen overflow-hidden ${isDarkTheme ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user}
      />
      
      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={sidebarOpen}
          user={user}
        />
        
        {/* Zone de contenu principale */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-dark-800 transition-colors duration-200">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;