import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useParams, useNavigate } from 'react-router-dom';
import authService from '../../api/authService';

/**
 * Page de réinitialisation du mot de passe
 * @returns {JSX.Element} Composant de réinitialisation de mot de passe
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const isTitle = useOutletContext().title;
  
  // État du formulaire
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // États de l'interface
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  // Vérifier la validité du token au chargement
  useEffect(() => {
    // Fonction de validation du token
    const validateToken = async () => {
      try {
        // Dans une vraie application, nous aurions un endpoint API pour valider le token
        // Ici, nous simulons simplement la validation en supposant que tous les tokens sont valides
        // sauf s'ils sont explicitement 'invalid' ou trop courts
        if (!token || token === 'invalid' || token.length < 10) {
          setTokenValid(false);
          setError('Le lien de réinitialisation est invalide ou a expiré.');
        }
      } catch (err) {
        console.error('Erreur lors de la validation du token:', err);
        setTokenValid(false);
        setError('Une erreur est survenue lors de la validation du token.');
      }
    };
    
    validateToken();
  }, [token]);
  
  // Gérer le changement des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      if (!formData.password.trim() || !formData.confirmPassword.trim()) {
        throw new Error('Veuillez remplir tous les champs');
      }
      
      // Valider la complexité du mot de passe
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.');
      }
      
      // Valider la confirmation du mot de passe
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      
      // Appeler l'API pour réinitialiser le mot de passe
      await authService.resetPassword(token, formData.password);
      
      // Afficher le message de succès
      setSuccess(true);
      
      // Réinitialiser le formulaire
      setFormData({
        password: '',
        confirmPassword: ''
      });
      
      // Rediriger vers la page de connexion après un délai
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
          }
        });
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Si c'est le titre de la page
  if (isTitle) {
    return 'Réinitialisation du mot de passe';
  }
  
  // Si le token est invalide
  if (!tokenValid) {
    return (
      <div>
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-500 dark:text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Lien invalide
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>
                  {error || 'Le lien de réinitialisation du mot de passe est invalide ou a expiré.'}
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/forgot-password"
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-dark-800"
                  >
                    Demander un nouveau lien
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Si la réinitialisation a réussi
  if (success) {
    return (
      <div>
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500 dark:text-green-400"
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
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                Réinitialisation réussie
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                <p>
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/login"
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-dark-800"
                  >
                    Aller à la connexion
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Formulaire de réinitialisation du mot de passe
  return (
    <div>
      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Veuillez choisir un nouveau mot de passe pour votre compte.
        </p>
      </div>
      
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
      
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="form-label">
            Nouveau mot de passe
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="form-label">
            Confirmer le mot de passe
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
            />
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
                Réinitialisation en cours...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;