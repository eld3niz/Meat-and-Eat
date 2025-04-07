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
      

      {/* Bio - Only shown if available */}
      {user.bio && (
        <p className="text-base text-gray-700 pt-3"> {/* Added pt-3 for spacing */}
          {user.bio}
        </p>
      )}
    </div>
  );
};

export default UserInfoPopup;