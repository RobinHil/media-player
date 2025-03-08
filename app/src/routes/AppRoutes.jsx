import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Routes protégées
import { ProtectedRoute, AdminRoute } from '../components/auth/ProtectedRoute';

// Pages publiques
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Pages protégées
import Home from '../pages/Home';
import MediaList from '../pages/media/MediaList';
import MediaDetails from '../pages/media/MediaDetails';
import Collections from '../pages/collections/Collections';
import CollectionDetails from '../pages/collections/CollectionDetails';
import Favorites from '../pages/Favorites';
import Recent from '../pages/Recent';
import Shared from '../pages/Shared';
import Upload from '../pages/Upload';
import Search from '../pages/Search';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import Help from '../pages/Help';

// Pages d'administration
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminSessions from '../pages/admin/AdminSessions';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminLogs from '../pages/admin/AdminLogs';

// Page d'erreur
import NotFound from '../pages/NotFound';

/**
 * Définition des routes de l'application
 * @returns {JSX.Element} Composant de routes
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Routes d'authentification */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      
      {/* Routes protégées */}
      <Route element={<MainLayout />}>
        {/* Page d'accueil */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes des médias */}
        <Route path="/media">
          <Route 
            path="all" 
            element={
              <ProtectedRoute>
                <MediaList type="all" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="videos" 
            element={
              <ProtectedRoute>
                <MediaList type="video" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="images" 
            element={
              <ProtectedRoute>
                <MediaList type="image" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="audio" 
            element={
              <ProtectedRoute>
                <MediaList type="audio" />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Visualisation des médias */}
        <Route 
          path="/view/:type/:path" 
          element={
            <ProtectedRoute>
              <MediaDetails />
            </ProtectedRoute>
          } 
        />
        
        {/* Navigation dans les dossiers */}
        <Route 
          path="/browse" 
          element={
            <ProtectedRoute>
              <MediaList type="all" mode="browse" />
            </ProtectedRoute>
          } 
        />
        
        {/* Collections */}
        <Route 
          path="/collections" 
          element={
            <ProtectedRoute>
              <Collections />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collections/:id" 
          element={
            <ProtectedRoute>
              <CollectionDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collections/create" 
          element={
            <ProtectedRoute>
              <Collections mode="create" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collections/add" 
          element={
            <ProtectedRoute>
              <Collections mode="add" />
            </ProtectedRoute>
          } 
        />
        
        {/* Favoris */}
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } 
        />
        
        {/* Éléments récents */}
        <Route 
          path="/recents" 
          element={
            <ProtectedRoute>
              <Recent />
            </ProtectedRoute>
          } 
        />
        
        {/* Éléments partagés */}
        <Route 
          path="/shared" 
          element={
            <ProtectedRoute>
              <Shared />
            </ProtectedRoute>
          } 
        />
        
        {/* Importation de fichiers */}
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } 
        />
        
        {/* Recherche */}
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } 
        />
        
        {/* Profil utilisateur */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Paramètres */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Aide */}
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes d'administration */}
        <Route path="/admin">
          <Route 
            index 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } 
          />
          <Route 
            path="sessions" 
            element={
              <AdminRoute>
                <AdminSessions />
              </AdminRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            } 
          />
          <Route 
            path="logs" 
            element={
              <AdminRoute>
                <AdminLogs />
              </AdminRoute>
            } 
          />
        </Route>
        
        {/* Page de partage (accessible via lien) */}
        <Route path="/share/:token" element={<MediaDetails shared />} />
        
        {/* Page 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;