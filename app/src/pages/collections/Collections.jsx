import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import mediaService from '../../api/mediaService';
import PageHeader from '../../components/common/PageHeader';
import MediaGrid from '../../components/media/MediaGrid';

/**
 * Page des collections
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Page de collections
 */
const Collections = ({ mode = 'view' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const path = queryParams.get('path');
  
  // État du formulaire pour la création de collection
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // État pour la sélection de collection lors de l'ajout d'un élément
  const [selectedCollection, setSelectedCollection] = useState('');
  
  // État de soumission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Récupérer les collections avec React Query
  const { 
    data: collections, 
    isLoading: collectionsLoading, 
    isError: collectionsError,
    refetch: refetchCollections
  } = useQuery(['collections'], () => mediaService.getCollections(), {
    enabled: mode !== 'add' || !path, // Ne pas charger lors de l'ajout si un path est fourni
  });
  
  // Titre de la page en fonction du mode
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Créer une collection';
      case 'add':
        return 'Ajouter à une collection';
      default:
        return 'Collections';
    }
  };
  
  // Gérer le changement des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer la soumission du formulaire de création
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // Valider les champs
      if (!formData.name.trim()) {
        throw new Error('Le nom de la collection est requis');
      }
      
      // Créer la collection
      await mediaService.createCollection(formData.name, formData.description);
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: ''
      });
      
      // Afficher le message de succès
      setSuccess('Collection créée avec succès');
      
      // Redirection après un délai
      setTimeout(() => {
        navigate('/collections');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la création de la collection:', err);
      setError(err.message || 'Une erreur est survenue lors de la création de la collection');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Gérer l'ajout à une collection
  const handleAddToCollection = async (e) => {
    e.preventDefault();
    
    if (submitting || !selectedCollection || !path) return;
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // Ajouter l'élément à la collection
      await mediaService.addToCollection(selectedCollection, path);
      
      // Afficher le message de succès
      setSuccess('Élément ajouté à la collection avec succès');
      
      // Redirection après un délai
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout à la collection:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'ajout à la collection');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Afficher le formulaire de création de collection
  const renderCreateForm = () => {
    return (
      <div className="mt-6 bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Message de succès */}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="form-label">
                  Nom de la collection *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    className="form-input"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description optionnelle"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création en cours...
                    </>
                  ) : (
                    'Créer la collection'
                  )}
                </button>
                <Link
                  to="/collections"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Annuler
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Afficher le formulaire d'ajout à une collection
  const renderAddForm = () => {
    return (
      <div className="mt-6 bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Message de succès */}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {path ? (
            <form onSubmit={handleAddToCollection}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="collection" className="form-label">
                    Sélectionner une collection *
                  </label>
                  <div className="mt-1">
                    <select
                      id="collection"
                      name="collection"
                      className="form-input"
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner une collection</option>
                      {collectionsLoading ? (
                        <option disabled>Chargement des collections...</option>
                      ) : collections?.length > 0 ? (
                        collections.map((collection) => (
                          <option key={collection._id} value={collection._id}>
                            {collection.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>Aucune collection disponible</option>
                      )}
                    </select>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={submitting || !selectedCollection}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Ajout en cours...
                      </>
                    ) : (
                      'Ajouter à la collection'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Aucun élément sélectionné pour l'ajout à une collection.</p>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mt-4 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Retour
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Afficher la liste des collections
  const renderCollectionsList = () => {
    // Si chargement
    if (collectionsLoading) {
      return (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-dark-700 overflow-hidden shadow rounded-lg">
              <div className="h-48 bg-gray-200 dark:bg-dark-600"></div>
              <div className="px-4 py-4">
                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Si erreur
    if (collectionsError) {
      return (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur lors du chargement des collections
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Si aucune collection
    if (!collections || collections.length === 0) {
      return (
        <div className="mt-6 text-center py-12 bg-white dark:bg-dark-700 shadow rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune collection</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Commencez par créer une collection pour organiser vos médias.
          </p>
          <div className="mt-6">
            <Link
              to="/collections/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer une collection
            </Link>
          </div>
        </div>
      );
    }
    
    // Afficher les collections
    return (
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Link
            key={collection._id}
            to={`/collections/${collection._id}`}
            className="bg-white dark:bg-dark-700 overflow-hidden shadow hover:shadow-md rounded-lg transition-shadow duration-300"
          >
            <div className="h-48 bg-gray-200 dark:bg-dark-600 flex items-center justify-center">
              {collection.thumbnail ? (
                <img
                  src={collection.thumbnail}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-16 w-16 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            <div className="px-4 py-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{collection.name}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {collection.items?.length || 0} élément{collection.items?.length !== 1 ? 's' : ''}
              </p>
              {collection.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {collection.description}
                </p>
              )}
            </div>
          </Link>
        ))}
        
        {/* Carte pour créer une nouvelle collection */}
        <Link
          to="/collections/create"
          className="bg-white dark:bg-dark-700 overflow-hidden shadow hover:shadow-md rounded-lg transition-shadow duration-300 border-2 border-dashed border-gray-300 dark:border-dark-600 flex flex-col items-center justify-center p-6"
        >
          <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Créer une collection</span>
        </Link>
      </div>
    );
  };
  
  // Rendu principal en fonction du mode
  const renderContent = () => {
    switch (mode) {
      case 'create':
        return renderCreateForm();
      case 'add':
        return renderAddForm();
      default:
        return renderCollectionsList();
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title={getTitle()}
        subtitle={mode === 'view' ? 'Organisez vos médias en collections thématiques' : ''}
      >
        {mode === 'view' && (
          <Link
            to="/collections/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nouvelle collection
          </Link>
        )}
      </PageHeader>
      
      {renderContent()}
    </div>
  );
};

export default Collections;