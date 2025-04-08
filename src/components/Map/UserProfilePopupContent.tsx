import React from 'react';
import supabase from '../../utils/supabaseClient'; // Keep for potential type imports if needed later
import { languageOptions, cuisineOptions } from '../../data/options'; // Assuming these are needed for display formatting

// Re-define or import the ProfileData interface
interface ProfileData {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  languages: string[] | null;
  cuisines: string[] | null;
  budget: number | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null; // Keep if needed for display (e.g., member since)
}

interface UserProfilePopupContentProps {
  profile: ProfileData;
}

// Helper function for budget emojis (copied from ReadOnlyUserProfile)
const getBudgetEmoji = (budgetLevel: number | null): string => {
  if (budgetLevel === 1) return '💰';
  if (budgetLevel === 2) return '💰💰';
  if (budgetLevel === 3) return '💰💰💰';
  return 'N/A';
};

// Helper function for formatting lists (copied from ReadOnlyUserProfile)
const formatList = (list: string[] | null): string => {
  if (!list || list.length === 0) return 'N/A';
  return list.join(', ');
};

const UserProfilePopupContent: React.FC<UserProfilePopupContentProps> = ({ profile }) => {
  // Base structure and styling mirrored from ReadOnlyUserProfile, but static
  return (
    // Removed outer positioning div, component renders directly into popup content
    // Reduced padding slightly for popup context
    <div className="bg-gray-50 p-3 max-w-md w-[320px] max-h-[70vh] overflow-y-auto">
        {/* No loading/error states needed here, handled before rendering */}
        <div className="flex flex-col h-full">
          {/* Profile Content Area */}
          <div className="flex-grow space-y-1"> {/* Reduced space-y */}
            {/* Top Section: Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-3 border-b pb-1.5"> {/* Reduced spacing */}
              <div className="flex-shrink-0 flex flex-col items-center">
                {/* Static Avatar Display */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.name || 'User'}'s avatar`}
                    className="w-[70px] h-[70px] rounded-full object-cover border border-gray-300" // Slightly smaller, added border
                  />
                ) : (
                  <div className="w-[70px] h-[70px] rounded-full bg-gray-300 flex items-center justify-center text-xl font-semibold text-gray-600 border border-gray-300">
                    {profile.name ? profile.name.substring(0, 1).toUpperCase() : '?'}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-grow text-center sm:text-left mt-1 sm:mt-0">
                <p className="text-md font-semibold text-gray-800 leading-tight">{profile.name || 'N/A'}</p>
                <p className="text-xs text-gray-600 leading-tight">
                  {profile.age ? `${profile.age} years old` : 'Age N/A'}
                  {profile.gender && ` • ${profile.gender}`}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 leading-tight">
                  Budget: {getBudgetEmoji(profile.budget)}
                </p>
              </div>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <div className="py-0.5">
                <h3 className="text-xs font-semibold text-gray-700 mb-0.5 leading-tight">About Me</h3>
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-tight">{profile.bio}</p>
              </div>
            )}

            {/* Languages Section */}
            <div className="py-0.5">
              <h3 className="text-xs font-semibold text-gray-700 mb-0.5 leading-tight">Languages</h3>
              <p className="text-xs text-gray-600 leading-tight">{formatList(profile.languages)}</p>
            </div>

            {/* Cuisines Section */}
            <div className="py-0.5">
              <h3 className="text-xs font-semibold text-gray-700 mb-0.5 leading-tight">Cuisines</h3>
              <p className="text-xs text-gray-600 leading-tight">{formatList(profile.cuisines)}</p>
            </div>
          </div> {/* End Profile Content Area */}

          {/* Removed Action Buttons Area */}
        </div>
    </div>
  );
};

export default UserProfilePopupContent;
// Removed internal close button, state, effects, and interactive elements