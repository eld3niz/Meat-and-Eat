import React from 'react';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';

interface TileListPopupProps {
  items: (City | MapUser)[];
  onClose: () => void;
}

const TileListPopup: React.FC<TileListPopupProps> = ({ items, onClose }) => {
  // Helper to determine if an item is a City
  const isCity = (item: City | MapUser): item is City => {
    return 'population' in item;
  };

  return (
    // Increased padding, slightly wider max-width, consistent styling with UserInfoPopup
    <div className="tile-list-popup-container p-4 max-w-sm bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        {/* Slightly larger title */}
        <h3 className="text-base font-semibold text-gray-800">Items in this Area ({items.length})</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none" // Slightly larger close button
          aria-label="Close popup"
        >
          &times; {/* Close symbol */}
        </button>
      </div>
      {/* Increased max-height, slightly larger text size */}
      <ul className="max-h-48 overflow-y-auto text-sm space-y-2">
        {items.map((item, index) => (
          <li key={isCity(item) ? `city-${item.id}` : `user-${item.user_id}-${index}`} className="p-2 rounded hover:bg-gray-50 cursor-default border border-gray-200">
            {isCity(item) ? (
              // Display City Name
              <div>
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className="text-gray-500 text-xs ml-2">(City)</span>
              </div>
            ) : (
              // Display User Name, Age, and Status
              <div>
                <span className="font-semibold text-gray-900">{item.name}</span>
                <div className="text-xs text-gray-600 mt-1 space-x-3">
                  {item.age !== undefined && item.age !== null && (
                    <span>Age: {item.age}</span>
                  )}
                  {item.is_local && (
                    <span>Status: {item.is_local}</span>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TileListPopup;