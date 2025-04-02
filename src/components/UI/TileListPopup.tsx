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
    <div className="tile-list-popup-container p-2 max-w-xs bg-white rounded shadow-lg">
      <div className="flex justify-between items-center mb-2 border-b pb-1">
        <h3 className="text-sm font-semibold text-gray-700">Items in this Area ({items.length})</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none"
          aria-label="Close popup"
        >
          &times; {/* Close symbol */}
        </button>
      </div>
      <ul className="max-h-40 overflow-y-auto text-xs space-y-1">
        {items.map((item, index) => (
          <li key={isCity(item) ? `city-${item.id}` : `user-${item.user_id}-${index}`} className="p-1 rounded hover:bg-gray-100 cursor-default">
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-500 ml-2">({isCity(item) ? 'City' : 'User'})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TileListPopup;