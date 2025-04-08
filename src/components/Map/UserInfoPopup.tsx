import React from 'react';
import { MapUser } from '../../types/map';
import ReadOnlyUserProfile from '../Profile/ReadOnlyUserProfile';

interface UserInfoPopupProps {
  user: MapUser;
}

/**
 * Popup component that displays when a user marker is clicked on the map.
 * Now uses ReadOnlyUserProfile for consistent styling across the application.
 */
const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ user }) => {
  // Simply use the ReadOnlyUserProfile component with the user's ID
  return (
    <div className="single-user-popup-container">
      <ReadOnlyUserProfile 
        userId={user.user_id}
        // No onClose handler needed as the popup is controlled by Leaflet
      />
    </div>
  );
};

export default UserInfoPopup;