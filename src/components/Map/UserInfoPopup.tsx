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
      {/* Custom Close Button - Slightly larger, added ID, removed onClick */}
      <button
        id="user-popup-close-btn" // Added ID
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors z-10" // Adjusted position
        aria-label="Close popup"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg> {/* Increased size w-6 h-6 */}
      </button>
      
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