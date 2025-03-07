import React from 'react';

/**
 * En-tête de page avec titre et actions
 * @param {Object} props - Props du composant
 * @returns {JSX.Element} Composant d'en-tête de page
 */
const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-4 md:mt-0 flex">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;