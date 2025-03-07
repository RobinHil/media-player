import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import config from '../config';

// Créer le contexte
export const ThemeContext = createContext();

// Thèmes disponibles
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Fournisseur du contexte de thème
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant fournisseur
 */
export const ThemeProvider = ({ children }) => {
  // État du thème
  const [theme, setTheme] = useState(() => {
    // Charger le thème stocké ou utiliser la valeur par défaut
    const storedTheme = localStorage.getItem('theme');
    return storedTheme || config.ui.defaultTheme;
  });
  
  // État du thème appliqué (résolu)
  const [appliedTheme, setAppliedTheme] = useState(theme === THEMES.SYSTEM ? getSystemTheme() : theme);
  
  /**
   * Détermine le thème du système
   * @returns {string} Thème du système ('light' ou 'dark')
   */
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }
  
  /**
   * Met à jour le DOM pour refléter le thème actuel
   * @param {string} newTheme - Thème à appliquer
   */
  const applyTheme = useCallback((newTheme) => {
    // Pour le thème système, déterminer le thème en fonction des préférences du système
    const resolvedTheme = newTheme === THEMES.SYSTEM ? getSystemTheme() : newTheme;
    
    // Mettre à jour le DOM
    if (resolvedTheme === THEMES.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setAppliedTheme(resolvedTheme);
  }, []);
  
  /**
   * Change le thème de l'application
   * @param {string} newTheme - Nouveau thème
   */
  const changeTheme = useCallback((newTheme) => {
    // Valider le thème
    if (!Object.values(THEMES).includes(newTheme)) {
      console.error(`Thème invalide: ${newTheme}`);
      return;
    }
    
    // Stocker le thème
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
    
    // Appliquer le thème
    applyTheme(newTheme);
  }, [applyTheme]);
  
  /**
   * Vérifie si le thème actuel est le thème sombre
   * @returns {boolean} True si le thème appliqué est sombre
   */
  const isDarkTheme = useMemo(() => appliedTheme === THEMES.DARK, [appliedTheme]);
  
  /**
   * Bascule entre les thèmes clair et sombre
   */
  const toggleTheme = useCallback(() => {
    const newTheme = isDarkTheme ? THEMES.LIGHT : THEMES.DARK;
    changeTheme(newTheme);
  }, [isDarkTheme, changeTheme]);
  
  // Surveiller les changements de préférence du système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Fonction de gestion des changements
    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM);
      }
    };
    
    // Attacher l'écouteur d'événements
    mediaQuery.addEventListener('change', handleChange);
    
    // Nettoyage
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);
  
  // Appliquer le thème initial
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);
  
  // Valeur du contexte
  const value = useMemo(() => ({
    theme,
    appliedTheme,
    isDarkTheme,
    changeTheme,
    toggleTheme,
    themes: THEMES,
  }), [theme, appliedTheme, isDarkTheme, changeTheme, toggleTheme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de thème
 * @returns {Object} Contexte de thème
 */
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  
  return context;
};