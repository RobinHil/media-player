import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import mediaService from '../../api/mediaService';
import PageHeader from '../../components/common/PageHeader';
import MediaGrid from '../../components/media/MediaGrid';
import Breadcrumb from '../../components/common/Breadcrumb';

/**
 * Page de détail d'une collection
 * @returns {JSX.Element} Page de détail de collection
 */
const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Récupérer les détails de la collection
  const { 
    data: collection, 
    isLoading: collectionLoading, 
    isError: collectionError 
  } = useQuery(
    ['collection', id], 
    () => mediaService.getCollectionDetails(id),
    {
      enabled: !!id,
      onError: (err) => {
        setError(err.message || 'Erreur lors du chargement de la collection');
      }
    }
  );
  
  // Récupérer les éléments de la collection
  const { 
    data: collectionItems, 
    isLoading: itemsLoading, 
    isError: itemsError 
  } = useQuery(
    ['collectionItems', id],
    () => mediaService.getCollectionItems(id),
    {
      enabled: !!id && !!collection,
      onError: (err) => {
        setError(err.message || 'Erreur lors du chargement des éléments de la collection');
      }
    }
  );
  
  // Mutation pour supprimer la collection
  const deleteCollectionMutation = useMutation(
    () => mediaService.deleteCollection(id),
    {
      onSuccess: () => {
        // Invalider la requête de collection
        queryClient.invalidateQueries('collections');
        // Rediriger vers la liste des collections
        navigate('/collections');
      },
      onError: (err) => {
        setError(err.message || 'Erreur lors de la suppression de la collection');
        setIsDeleteModalOpen(false);
      }
    }
  );
  
  // Mutation pour supprimer un élément de la collection
  const deleteItemMutation = useMutation(
    (itemPath) => mediaService.removeFromCollection(id, itemPath),
    {
      onSuccess: () => {
        // Invalider la requête des éléments
        queryClient.invalidateQueries(['collectionItems', id]);
        // Fermer le modal
        setIsDeleteItemModalOpen(false);
        setItemToDelete(null);
      },
      onError: (err) => {
        setError(err.message || 'Erreur lors de la suppression de l\'élément');
        setIsDeleteItemModalOpen(false);
      }
    }
  );
  
  // Gérer la suppression d'un élément
  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setIsDeleteItemModalOpen(true);
  };
  
  // Confirmer la suppression d'un élément
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.path);
    }
  };
  
  // Confirmer la suppression de la collection
  const confirmDeleteCollection = () => {
    deleteCollectionMutation.mutate();
  };
  
  // Afficher la page de chargement
  if (collectionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-dark-600 rounded aspect-video"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher la page d'erreur
  if (collectionError || !collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Erreur" />
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-red-700 dark:text-red-300">
            {error || 'Collection introuvable'}
          </p>
          <button
            onClick={() => navigate('/collections')}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            Retour aux collections
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { name: 'Accueil', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: collection.name, path: null }
        ]}
      />
      
      <PageHeader
        title={collection.name}
        subtitle={`${collectionItems?.length || 0} élément${(collectionItems?.length || 0) !== 1 ? 's' : ''}`}
      >
        <div className="flex space-x-2">
          <Link
            to={`/collections/add`}
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
            Ajouter des éléments
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Supprimer la collection
          </button>
        </div>
      </PageHeader>
      
      {collection.description && (
        <div className="mt-4 bg-white dark:bg-dark-700 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Description
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>{collection.description}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Afficher les éléments de la collection */}
      <div className="mt-6">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
          Contenu de la collection
        </h2>
        
        {itemsLoading ? (
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-dark-600 rounded aspect-video"></div>
            ))}
          </div>
        ) : itemsError ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-300">
              Erreur lors du chargement des éléments
            </p>
          </div>
        ) : collectionItems && collectionItems.length > 0 ? (
          <MediaGrid items={collectionItems} onDeleteClick={handleDeleteItem} />
        ) : (
          <div className="text-center py-12 bg-white dark:bg-dark-700 rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun élément</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cette collection est vide. Ajoutez des éléments pour commencer.
            </p>
            <div className="mt-6">
              <Link
                to="/collections/add"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                Ajouter des éléments
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression de la collection */}
      {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Supprimer la collection
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Êtes-vous sûr de vouloir supprimer la collection "{collection.name}" ? Cette action est irréversible et supprimera la collection et tous ses liens. Les fichiers eux-mêmes ne seront pas supprimés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteCollection}
                  disabled={deleteCollectionMutation.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteCollectionMutation.isLoading ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation de suppression d'un élément */}
      {isDeleteItemModalOpen && itemToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-700 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-dark-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Retirer de la collection
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Êtes-vous sûr de vouloir retirer "{itemToDelete.name}" de cette collection ? Cette action retirera uniquement l'élément de la collection mais ne supprimera pas le fichier.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  disabled={deleteItemMutation.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteItemMutation.isLoading ? 'Suppression...' : 'Retirer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteItemModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-dark-600 shadow-sm px-4 py-2 bg-white dark:bg-dark-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetails;