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
    // Increased padding, wider max-width (2xl), larger fonts, more prominent shadow, removed text-center for structured layout
    <div className="user-info-popup-container p-5 max-w-2xl bg-white rounded-lg shadow-xl popup-open-anim relative"> {/* Changed max-w-xl to max-w-2xl */}
      
      {/* User Name - Larger font */}
      <p className="text-xl font-semibold text-gray-900 mb-3 text-center border-b pb-3 pt-1"> {/* Increased text, mb, pb. Added pt-1 */}
        {user.name || 'N/A'}
      </p>

      {/* Local Status */}
      <div className="text-base text-gray-700 mb-4 space-y-2 pt-3"> {/* Increased text, mb, space-y, pt */}
        <p>
          <span className="font-medium text-gray-800">Local Status:</span> {user.is_local || 'N/A'}
        </p>
        
        {/* Bio */}
        <p>
          <span className="font-medium text-gray-800">Bio:</span> {user.bio || 'N/A'}
        </p>
        
        {/* Age if available */}
        {user.age !== undefined && user.age !== null && (
          <p><span className="font-medium text-gray-800">Age:</span> {user.age}</p>
        )}
      </div>
    </div>
  );
};

export default UserInfoPopup;