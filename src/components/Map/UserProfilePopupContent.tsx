import React from 'react';
import AvatarUpload from '../Auth/AvatarUpload';

// Helper functions from original component
const formatList = (list: string[] | null): string => {
  if (!list || list.length === 0) return 'N/A';
  return list.join(', ');
};

const getBudgetEmoji = (budget: string | number | null): string => { // Allow number type
  const budgetStr = String(budget); // Convert to string for comparison
  if (budgetStr === '1') return '💰';
  if (budgetStr === '2') return '💰💰';
  if (budgetStr === '3') return '💰💰💰';
  return 'N/A';
};

interface UserProfilePopupContentProps {
  profile: any;
  onAvatarClick?: () => void; // Add prop for avatar click
}

const UserProfilePopupContent: React.FC<UserProfilePopupContentProps> = ({ profile, onAvatarClick }) => {
  return (
    <div className="bg-gray-50 p-3 w-full max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Top Section: Avatar & Basic Info */}
        <div className="flex flex-col items-center border-b pb-2">
          <div className="flex-shrink-0 mb-2">
            {/* Use AvatarUpload component */}
            <AvatarUpload
              avatarUrl={profile.avatar_url}
              uploading={false}
              isReadOnly={true}
              onClick={onAvatarClick} // Add click handler
              size={70} // Slightly smaller to fit popup
            />
          </div>

          {/* Basic Info */}
          <div className="text-center mt-1">
            <p className="text-lg font-semibold text-gray-800 leading-tight">{profile.name || 'N/A'}</p>
            <p className="text-xs text-gray-600 leading-tight">
              {profile.age ? `${profile.age} years old` : 'Age N/A'}
              {profile.gender && ` • ${profile.gender}`}
            </p>
            
            {/* Travel Status - Fetched from profile or default */}
            <p className="text-xs text-gray-600 mt-2 mb-1 leading-tight">
              <span className="inline-flex items-center">
                <span className="mr-1">🌍</span>
                {profile.travel_status || 'Explorer'}
              </span>
            </p>
            
            {/* Added more padding with mt-2 */}
            <p className="text-sm text-gray-600 mt-2 leading-tight">
              Budget: {getBudgetEmoji(profile.budget)}
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-2 border-b pb-2">
          <h3 className="text-sm font-medium text-gray-700">About Me</h3>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
            {profile.bio || 'No bio available.'}
          </p>
        </div>

        {/* Food Preferences */}
        <div className="mt-2 border-b pb-2">
          <h3 className="text-sm font-medium text-gray-700">Food Preferences</h3>
          <p className="text-sm text-gray-600 mt-1">
            {profile.cuisines && profile.cuisines.length > 0
              ? formatList(profile.cuisines)
              : 'No preferences specified.'}
          </p>
        </div>

        {/* Languages */}
        <div className="mt-2">
          <h3 className="text-sm font-medium text-gray-700">Languages</h3>
          <p className="text-sm text-gray-600 mt-1">
            {profile.languages && profile.languages.length > 0
              ? formatList(profile.languages)
              : 'No languages specified.'}
          </p>
        </div>

        {/* Action Buttons - Simplified Version */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg shadow text-xs font-medium flex items-center justify-center space-x-1"
          >
            <span>💬</span>
            <span>Chat</span>
          </button>
          <button
            type="button"
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg shadow text-xs font-medium flex items-center justify-center space-x-1"
          >
            <span>🤝</span>
            <span>Meet Me</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopupContent;