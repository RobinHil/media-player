import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import './styles/index.css';

// Créer un client de requête pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Ne pas refetch lors du focus sur la fenêtre
      retry: 1, // Refaire une tentative en cas d'échec
      staleTime: 60 * 1000, // Considérer les données comme périmées après 1 minute
    },
  },
});

/**
 * Composant principal de l'application
 * @returns {JSX.Element} Composant App
 */
function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;