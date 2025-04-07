import React from 'react';
import { MapUser } from '../../hooks/useMapData'; // Adjust path as needed

interface UserInfoPopupProps {
  user: MapUser;
  onClose: () => void; // Function to call when the popup should be closed (e.g., by Leaflet)
}

// Import a placeholder icon if needed, or use inline SVG/text
// import { UserCircleIcon } from '@heroicons/react/24/solid'; // Example if using Heroicons

const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ user, onClose }) => {
  // Determine user status based on is_local (string type)
  const renderUserStatus = (isLocalStatus: string | null | undefined) => {
    if (isLocalStatus === 'Local') return 'Local 🏠';
    if (isLocalStatus === 'Traveller') return 'Traveller ✈️';
    // Handle null, undefined, or other unexpected strings
    return 'Status Unknown';
  };

  const status = renderUserStatus(user.is_local);

  return (
    // Mimic UserProfile structure and styling within the popup container
    // Adjusted max-width and padding for popup context
    <div className="user-info-popup-container p-4 max-w-md bg-white rounded-lg shadow-lg popup-open-anim relative text-sm">

      {/* Top Section: Avatar/Rating + Basic Info */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Left Column: Avatar Placeholder & Rating Placeholder */}
        <div className="flex-shrink-0 flex flex-col items-center w-16"> {/* Fixed width */}
          {/* Placeholder Avatar */}
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 mb-1">
            {/* Placeholder Icon/Initial - Replace with actual icon if available */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 text-center">Rating N/A</p>
        </div>

        {/* Right Column: Info */}
        <div className="flex-grow pt-1">
          <h3 className="text-base font-semibold text-gray-800 truncate">{user.name || 'N/A'}</h3>
          <p className="text-xs text-gray-600">
            Age: {user.age ?? 'N/A'} | Gender: N/A
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {status}
          </p>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-600 mb-1">About Me</p>
        <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
          {user.bio || 'Not Given'}
        </p>
      </div>

      {/* Details Section */}
      <div className="mt-3 pt-2 border-t border-gray-200 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div>
          <span className="font-medium text-gray-600">Languages:</span>
          <span className="text-gray-700 ml-1">Not Given</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Cuisines:</span>
          <span className="text-gray-700 ml-1">Not Given</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Budget:</span>
          <span className="text-gray-700 ml-1">{user.budget ? `$${user.budget}/day` : 'Not Given'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Home:</span>
          <span className="text-gray-700 ml-1">Not Given</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Member Since:</span>
          <span className="text-gray-700 ml-1">N/A</span>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-2">
        <button
          type="button"
          className="bg-gray-400 text-white text-xs font-bold py-1 px-3 rounded opacity-50 cursor-not-allowed"
          disabled
        >
          Meet
        </button>
        <button
          type="button"
          className="bg-gray-400 text-white text-xs font-bold py-1 px-3 rounded opacity-50 cursor-not-allowed"
          disabled
        >
          Chat
        </button>
      </div>

    </div>
  );
};

export default UserInfoPopup;