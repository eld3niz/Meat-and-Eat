import React from 'react';
import { MapUser } from '../../hooks/useMapData'; // Ensure MapUser in useMapData includes all fields now

interface UserInfoPopupProps {
  user: MapUser; // User prop now contains all necessary data
  onClose: () => void;
}

const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ user, onClose }) => {

  // Helper function to determine user status display
  const renderUserStatus = (isLocalStatus: string | null | undefined) => {
    if (isLocalStatus === 'Local') return 'Local 🏠';
    if (isLocalStatus === 'Traveller') return 'Traveller ✈️';
    return 'Status Unknown'; // Default/fallback
  };

  const status = renderUserStatus(user.is_local);

  // Helper function to safely join arrays, handling null/undefined
  const safeJoin = (arr: string[] | null | undefined, separator: string = ', '): string => {
    return (arr && arr.length > 0) ? arr.join(separator) : 'Not Given';
  };

  return (
    // Compact Redesign: Reduced padding, max-width, base text size
    <div className="user-info-popup-container p-3 max-w-md bg-white rounded-lg shadow-lg relative text-sm"> {/* Removed popup-open-anim */}

      {/* Section 1: Avatar, Name, Age, Gender, Status */}
      <div className="flex items-start space-x-3 mb-2 pb-2 border-b border-gray-200">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 overflow-hidden">
            {user.avatar_url ? (
              // Added null check for safety, though TS might infer from the condition
              <img src={user.avatar_url} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        {/* Info Stack */}
        <div className="flex-grow pt-1">
          <h3 className="text-base font-semibold text-gray-900 truncate mb-0.5">{user.name || 'N/A'}</h3>
          <p className="text-xs text-gray-600 leading-tight">
            {user.age ? `Age: ${user.age}` : 'Age: N/A'}
            <span className="mx-1">|</span>
            {user.gender || 'Gender: N/A'}
            <span className="mx-1">|</span>
            {status}
          </p>
        </div>
      </div>

      {/* Section 2: Details (Languages, Cuisines, Budget) */}
      <div className="mb-2 pb-2 border-b border-gray-200 text-xs space-y-0.5">
        <div>
          <span className="font-semibold text-gray-700">Languages: </span>
          {/* Use safeJoin helper */}
          <span className="text-gray-600">{safeJoin(user.languages)}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Cuisines: </span>
           {/* Use safeJoin helper */}
          <span className="text-gray-600">{safeJoin(user.cuisines)}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Budget: </span>
          <span className="text-gray-600">{user.budget ? `$${user.budget}/day` : 'Not Given'}</span>
        </div>
      </div>

      {/* Section 3: Bio */}
      <div className="mb-3">
         <h4 className="text-sm font-semibold text-gray-800 mb-0.5">About Me</h4>
         {/* Added max-h-20 and overflow-y-auto for potentially long bios */}
         <p className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
           {user.bio || 'Not Given'}
         </p>
      </div>

      {/* Buttons Section - Smaller buttons */}
      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end space-x-1.5">
        <button
          type="button"
          className="bg-gray-400 text-white text-xs font-medium py-1 px-2 rounded opacity-50 cursor-not-allowed"
          disabled
        >
          Meet
        </button>
        <button
          type="button"
          className="bg-gray-400 text-white text-xs font-medium py-1 px-2 rounded opacity-50 cursor-not-allowed"
          disabled
        >
          Chat
        </button>
      </div>

    </div>
  );
};

export default UserInfoPopup;