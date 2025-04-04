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
    // Increased padding, wider max-width (2xl), larger fonts, consistent styling with UserInfoPopup
    <div className="tile-list-popup-container p-5 max-w-2xl bg-white rounded-lg shadow-xl popup-open-anim relative"> {/* Changed max-w-xl to max-w-2xl */}
       {/* Custom Close Button - Slightly larger, added ID, removed onClick */}
       <button
         id="tile-popup-close-btn" // Added ID
         // onClick={onClose} // Removed React onClick
         className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors z-10" // Adjusted position
         aria-label="Close popup"
       >
         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg> {/* Increased size w-6 h-6 */}
       </button>
      <div className="flex justify-between items-center mb-4 border-b pb-3 pt-2"> {/* Increased mb, pb, pt */}
        {/* Larger title */}
        <h3 className="text-lg font-semibold text-gray-800">Items in this Area ({items.length})</h3> {/* Increased text */}
        {/* Removed old close button */}
      </div>
      {/* REMOVED max-h and overflow-y-auto, larger text size, more spacing */}
      <ul className="text-base space-y-3"> {/* Increased text, space-y */}
        {items.map((item, index) => (
          <li key={isCity(item) ? `city-${item.id}` : `user-${item.user_id}-${index}`} className="p-3 rounded hover:bg-gray-50 cursor-default border border-gray-200"> {/* Increased p */}
            {isCity(item) ? (
              // Display City Name - Larger font
              <div>
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className="text-gray-500 text-sm ml-2">(City)</span> {/* Increased text */}
              </div>
            ) : (
              // Display User Name, Age, and Status - Larger font
              <div>
                <span className="font-semibold text-gray-900">{item.name}</span>
                <div className="text-sm text-gray-600 mt-1 space-x-4"> {/* Increased text, space-x */}
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