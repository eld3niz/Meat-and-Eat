import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { MapUser } from '../../hooks/useMapData'; // Adjust path as needed
import supabase from '../../utils/supabaseClient'; // Import Supabase client

interface UserInfoPopupProps {
  user: MapUser;
  onClose: () => void; // Function to call when the popup should be closed (e.g., by Leaflet)
}

// Interface for the additional profile data we want to fetch
interface ExtraProfileData {
  avatar_url: string | null;
  gender: string | null;
  languages: string[] | null;
  cuisines: string[] | null;
  // rating: number | null; // Rating not currently in profiles table
}

// Import a placeholder icon if needed, or use inline SVG/text
// import { UserCircleIcon } from '@heroicons/react/24/solid'; // Example if using Heroicons

const UserInfoPopup: React.FC<UserInfoPopupProps> = ({ user, onClose }) => {
  const [extraData, setExtraData] = useState<ExtraProfileData | null>(null);
  const [loadingExtra, setLoadingExtra] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch extra profile data when the component mounts (popup opens)
  useEffect(() => {
    const fetchExtraData = async () => {
      // Don't fetch for mock users (assuming they have specific IDs or patterns)
      // Adjust this condition based on how mock users are identified
      if (user.user_id.startsWith('mock-')) {
          setLoadingExtra(false);
          setExtraData(null); // Ensure extraData is null for mocks
          return;
      }

      setLoadingExtra(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, gender, languages, cuisines') // Select the needed fields
          .eq('id', user.user_id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error for users without profile entries yet
          console.error('Error fetching extra profile data:', error);
          throw error;
        }
        setExtraData(data);
      } catch (error: any) {
        setFetchError('Could not load profile details.');
      } finally {
        setLoadingExtra(false);
      }
    };

    fetchExtraData();
  }, [user.user_id]); // Re-fetch if the user ID changes

  // Determine user status based on is_local (string type)
  const renderUserStatus = (isLocalStatus: string | null | undefined) => {
    if (isLocalStatus === 'Local') return 'Local 🏠';
    if (isLocalStatus === 'Traveller') return 'Traveller ✈️';
    // Handle null, undefined, or other unexpected strings
    return 'Status Unknown';
  };

  const status = renderUserStatus(user.is_local);

  return (
    // Mimic UserProfile structure and styling, make wider (lg)
    // Adjusted max-width (lg) and padding for popup context
    <div className="user-info-popup-container p-4 max-w-lg bg-white rounded-lg shadow-lg popup-open-anim relative text-sm">

      {/* Top Section: Avatar/Rating + Basic Info */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Left Column: Avatar Placeholder & Rating Placeholder */}
        <div className="flex-shrink-0 flex flex-col items-center w-16"> {/* Fixed width */}
          {/* Actual Avatar or Placeholder */}
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 mb-1 overflow-hidden">
            {loadingExtra ? (
              <div className="animate-pulse w-full h-full bg-gray-400"></div>
            ) : extraData?.avatar_url ? (
              <img src={extraData.avatar_url} alt={user.name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              // Default Placeholder Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center">Rating N/A</p>
        </div>

        {/* Right Column: Info */}
        <div className="flex-grow pt-1">
          <h3 className="text-base font-semibold text-gray-800 truncate">{user.name || 'N/A'}</h3>
          <p className="text-xs text-gray-600">
            Age: {user.age ?? 'N/A'} | Gender: {loadingExtra ? '...' : extraData?.gender || 'N/A'}
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
          <span className="text-gray-700 ml-1">
            {loadingExtra ? '...' : (extraData?.languages && extraData.languages.length > 0) ? extraData.languages.join(', ') : 'Not Given'}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Cuisines:</span>
          <span className="text-gray-700 ml-1">
             {loadingExtra ? '...' : (extraData?.cuisines && extraData.cuisines.length > 0) ? extraData.cuisines.join(', ') : 'Not Given'}
          </span>
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
         {fetchError && <div className="col-span-2 text-red-500 text-xs mt-1">{fetchError}</div>}
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