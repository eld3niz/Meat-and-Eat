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
    <div className="user-info-popup-container p-2 max-w-xs bg-white rounded shadow-lg text-center">
       <div className="flex justify-between items-center mb-1 border-b pb-1">
         <h3 className="text-sm font-semibold text-gray-700 flex-grow text-center">User Location</h3>
         {/* Leaflet usually provides its own close button, but we can add one if needed */}
         {/* <button
           onClick={onClose}
           className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none"
           aria-label="Close popup"
         >
           &times;
         </button> */}
       </div>
      <p className="text-sm font-medium text-gray-800 mt-1">
        {/* Display user name */}
        {user.name || 'User'}
      </p>
      {/* Display bio if available */}
      {user.bio && (
        <p className="text-xs text-gray-600 mt-1 border-t pt-1">{user.bio}</p>
      )}
      {/* Add more user details here if available and desired (e.g., budget, local status) */}
    </div>
  );
};

export default UserInfoPopup;