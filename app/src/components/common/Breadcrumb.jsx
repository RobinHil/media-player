import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Composant de fil d'Ariane
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant Breadcrumb
 */
const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 md:space-x-3 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          // Élément cliquable ou non
          if (isLast || !item.path) {
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg 
                    className="w-5 h-5 text-gray-400 dark:text-gray-500" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span 
                  className={`ml-1 text-sm font-medium ${
                    isLast ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </span>
              </li>
            );
          }
          
          // Élément cliquable
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg 
                  className="w-5 h-5 text-gray-400 dark:text-gray-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              <Link
                to={item.path}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;