import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';

/**
 * Page d'aide
 * @returns {JSX.Element} Page d'aide
 */
const Help = () => {
  const [openSection, setOpenSection] = useState('basics');
  
  // Gérer l'ouverture/fermeture des sections
  const toggleSection = (section) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };
  
  // Vérifier si une section est ouverte
  const isOpen = (section) => openSection === section;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Aide" subtitle="Consultez nos guides et tutoriels" />
      
      <div className="mt-6 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-dark-700 shadow sm:rounded-lg overflow-hidden">
          {/* Introduction */}
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
              Bienvenue dans l'aide de MediaVault
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cette section contient des guides et tutoriels pour vous aider à utiliser 
              l'application MediaVault. Si vous avez des questions supplémentaires, 
              n'hésitez pas à contacter notre support.
            </p>
          </div>
          
          {/* FAQ accordéon */}
          <div className="border-t border-gray-200 dark:border-dark-600">
            {/* Bases */}
            <div>
              <button
                type="button"
                className="w-full px-4 py-5 sm:px-6 text-left focus:outline-none"
                onClick={() => toggleSection('basics')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Notions de base
                  </h3>
                  <span className="ml-6 h-7 flex items-center">
                    <svg
                      className={`h-6 w-6 transform ${isOpen('basics') ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 ease-in-out`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>
              
              {isOpen('basics') && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Qu'est-ce que MediaVault ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        MediaVault est une application de gestion et de lecture de médias qui vous permet
                        d'organiser, consulter et partager vos fichiers multimédias (vidéos, images, audio)
                        de manière simple et efficace.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment naviguer dans l'application ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Utilisez la barre latérale pour accéder aux différentes sections de l'application :
                        <ul className="list-disc pl-5 mt-2">
                          <li>Tableau de bord : vue d'ensemble de votre médiathèque</li>
                          <li>Médias : tous vos fichiers multimédias, classés par type</li>
                          <li>Collections : vos regroupements personnalisés</li>
                          <li>Favoris : vos médias préférés</li>
                          <li>Médias récents : derniers fichiers consultés</li>
                          <li>Partagés : médias que vous avez partagés</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment rechercher des médias ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Utilisez la barre de recherche en haut de l'écran pour trouver rapidement vos médias
                        par nom, type ou contenu. Les résultats s'affichent instantanément et peuvent être
                        filtrés par type (vidéo, audio, image).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Gestion des fichiers */}
            <div className="border-t border-gray-200 dark:border-dark-600">
              <button
                type="button"
                className="w-full px-4 py-5 sm:px-6 text-left focus:outline-none"
                onClick={() => toggleSection('files')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Gestion des fichiers
                  </h3>
                  <span className="ml-6 h-7 flex items-center">
                    <svg
                      className={`h-6 w-6 transform ${isOpen('files') ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 ease-in-out`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>
              
              {isOpen('files') && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment importer des médias ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Cliquez sur le bouton "Importer des médias" depuis le tableau de bord ou n'importe
                        quelle page de navigation. Vous pouvez sélectionner des fichiers depuis votre
                        ordinateur ou simplement les glisser-déposer dans la zone dédiée.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment créer des collections ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Accédez à la section "Collections" puis cliquez sur "Nouvelle collection".
                        Donnez un nom à votre collection, ajoutez une description (optionnelle),
                        puis vous pourrez y ajouter des médias. Vous pouvez également ajouter
                        directement un média à une collection depuis sa page de détails.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment ajouter des favoris ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Depuis la page de détails d'un média ou depuis les vignettes en mode grille,
                        cliquez sur l'icône en forme d'étoile pour ajouter ou retirer un élément
                        de vos favoris. Tous vos favoris sont accessibles depuis la section "Favoris"
                        dans la barre latérale.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Lecture et partage */}
            <div className="border-t border-gray-200 dark:border-dark-600">
              <button
                type="button"
                className="w-full px-4 py-5 sm:px-6 text-left focus:outline-none"
                onClick={() => toggleSection('playback')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Lecture et partage
                  </h3>
                  <span className="ml-6 h-7 flex items-center">
                    <svg
                      className={`h-6 w-6 transform ${isOpen('playback') ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 ease-in-out`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>
              
              {isOpen('playback') && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Options de lecture vidéo
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Le lecteur vidéo offre plusieurs fonctionnalités :
                        <ul className="list-disc pl-5 mt-2">
                          <li>Sélection de la qualité (auto, 240p, 360p, 480p, 720p, 1080p)</li>
                          <li>Choix du format (auto, mp4, webm, hls)</li>
                          <li>Activation des sous-titres (si disponibles)</li>
                          <li>Contrôle du volume</li>
                          <li>Mode plein écran</li>
                          <li>Picture-in-Picture</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Comment partager des médias ?
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Pour partager un média, ouvrez sa page de détails puis cliquez sur 
                        le bouton "Partager". Vous pouvez définir une durée de validité, 
                        ajouter un mot de passe ou limiter le nombre d'accès.
                        Un lien unique sera généré, que vous pourrez copier et partager.
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Téléchargement des médias
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Vous pouvez télécharger n'importe quel média depuis sa page de détails
                        en cliquant sur le bouton "Télécharger". Les fichiers seront téléchargés
                        dans leur format original et leur qualité maximale.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Paramètres */}
            <div className="border-t border-gray-200 dark:border-dark-600">
              <button
                type="button"
                className="w-full px-4 py-5 sm:px-6 text-left focus:outline-none"
                onClick={() => toggleSection('settings')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Paramètres et personnalisation
                  </h3>
                  <span className="ml-6 h-7 flex items-center">
                    <svg
                      className={`h-6 w-6 transform ${isOpen('settings') ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 ease-in-out`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>
              
              {isOpen('settings') && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Paramètres d'affichage
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Vous pouvez personnaliser l'apparence de l'application :
                        <ul className="list-disc pl-5 mt-2">
                          <li>Thème clair ou sombre (ou suivre les préférences du système)</li>
                          <li>Mode d'affichage par défaut (grille ou liste)</li>
                          <li>Nombre d'éléments par page</li>
                          <li>Langue de l'interface</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Préférences de lecture
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Configurez vos préférences de lecture :
                        <ul className="list-disc pl-5 mt-2">
                          <li>Lecture automatique</li>
                          <li>Qualité de vidéo par défaut</li>
                          <li>Format de vidéo préféré</li>
                        </ul>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-dark-800 rounded-md p-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Gestion du compte
                      </h4>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Accédez à votre profil pour :
                        <ul className="list-disc pl-5 mt-2">
                          <li>Modifier vos informations personnelles</li>
                          <li>Changer votre mot de passe</li>
                          <li>Gérer vos sessions actives</li>
                        </ul>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Contact */}
          <div className="border-t border-gray-200 dark:border-dark-600 px-4 py-6 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Besoin d'aide supplémentaire ?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à contacter notre
              équipe de support.
            </p>
            <div className="mt-4">
              <a
                href="mailto:support@mediavault.com"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;