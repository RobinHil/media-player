import React, { useState } from 'react';
import { Link, useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Page de connexion
 * @returns {JSX.Element} Composant de connexion
 */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isTitle = useOutletContext().title;
  
  // Récupérer l'URL de redirection (si elle existe)
  const from = location.state?.from?.pathname || '/';
  
  // État du formulaire
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // État de soumission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Gérer le changement des champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      // Valider les champs
      if (!formData.email.trim() || !formData.password.trim()) {
        throw new Error('Veuillez remplir tous les champs');
      }
      
      // Appeler le service d'authentification
      await login(formData.email, formData.password, formData.rememberMe);
      
      // Rediriger vers la page précédente ou l'accueil
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Si c'est le titre de la page
  if (isTitle) {
    return 'Connexion à votre compte';
  }
  
  // Récupérer les messages d'état (ex: inscription réussie)
  const successMessage = location.state?.message;
  
  return (
    <div>
      {/* Afficher les messages de succès */}
      {successMessage && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Afficher les erreurs */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
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
      
      {/* Formulaire de connexion */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="form-label">
            Adresse e-mail
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="votreemail@exemple.com"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-dark-600 dark:bg-dark-700"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Se souvenir de moi
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
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
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-dark-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400">
              Ou
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="mt-1 grid grid-cols-1 gap-3">
            <a
              href="#"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm bg-white dark:bg-dark-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-600"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vous n'avez pas de compte ?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;