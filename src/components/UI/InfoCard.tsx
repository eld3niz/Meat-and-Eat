import React from 'react';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface InfoCardProps {
  city: City;
  onClose: () => void;
}

/**
 * Kartenkomponente für detaillierte Stadtinformationen
 * Wird auf größeren Bildschirmen anstelle eines Popups angezeigt
 */
const InfoCard: React.FC<InfoCardProps> = ({ city, onClose }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 max-w-sm scale-80 origin-top-right">
      <div className="flex justify-between items-center p-4 bg-blue-50 border-b">
        <h2 className="text-xl font-bold text-blue-800">{city.name}</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 focus:outline-none p-1"
          aria-label="Schließen"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-2 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full inline-block">
          {city.country}
        </div>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-xs text-gray-500 block">Bevölkerung</span>
            <span className="font-bold text-blue-700">{formatPopulation(city.population)}</span>
          </div>
          
          {city.foundedYear && (
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-xs text-gray-500 block">Gegründet</span>
              <span className="font-medium">{city.foundedYear}</span>
            </div>
          )}
        </div>
        
        <div className="my-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Über die Stadt</h3>
          <p className="text-sm text-gray-600">
            {city.description}
          </p>
        </div>
        
        {city.landmarks && city.landmarks.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Sehenswürdigkeiten</h3>
            <ul className="space-y-1">
              {city.landmarks.map((landmark, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {landmark}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-4 pt-2 text-center">
          <button 
            onClick={() => window.open(`https://www.google.com/maps/search/${city.name},+${city.country}`, '_blank')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            In Google Maps anzeigen &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
