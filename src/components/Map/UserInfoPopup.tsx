import React from 'react';
import { MapUser } from '../../hooks/useMapData'; // Adjust path as needed

interface UserInfoPopupProps {
  user: MapUser;
  onClose: () => void; // Function to call when the popup should be closed (e.g., by Leaflet)
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ user, onClose }) => {
  // Note: This component is designed to be rendered *inside* a Leaflet Popup.
  // The 'onClose' prop might not be strictly necessary if Leaflet handles the closing,
  // but it's good practice for potential future use or manual closing logic.

  return (
    // Increased padding, slightly wider max-width, more prominent shadow, removed text-center for structured layout
    <div className="user-info-popup-container p-4 max-w-sm bg-white rounded-lg shadow-xl">
      {/* Removed custom header as Leaflet usually provides a close button */}

      {/* User Name */}
      <p className="text-lg font-semibold text-gray-900 mb-2 text-center border-b pb-2">
        {user.name || 'User'}
      </p>

      {/* Age and Local Status */}
      <div className="text-sm text-gray-700 mb-3 space-y-1 pt-2">
        {user.age !== undefined && user.age !== null && ( // Display age if available and not null/undefined
          <p><span className="font-medium text-gray-800">Age:</span> {user.age}</p>
        )}
        {user.is_local && ( // Display local status if available
          <p><span className="font-medium text-gray-800">Status:</span> {user.is_local}</p>
        )}
        {/* Display message if neither age nor status is available */}
        {(user.age === undefined || user.age === null) && !user.is_local && (
            <p className="text-gray-500 italic">No additional details available.</p>
        )}
      </div>

      {/* Display bio if available */}
      {user.bio && (
        <div className="border-t pt-2">
            <p className="text-xs text-gray-600">{user.bio}</p>
        </div>
      )}
    </div>
  );
};

export default UserInfoPopup;