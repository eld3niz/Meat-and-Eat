import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options'; // Assuming these are needed for display formatting
import AvatarUpload from '../Auth/AvatarUpload'; // Reusing the avatar component
import ImageModal from '../UI/ImageModal'; // For viewing avatar fullscreen

// Define the profile data structure needed for display
// Simplified from UserProfile.tsx, removing edit-specific fields if any
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
  created_at: string | null;
  // Include location if we want to display it (e.g., "Based near X")
  // home_latitude: number | null;
  // home_longitude: number | null;
  // home_location_last_updated: string | null;
}

interface ReadOnlyUserProfileProps {
  userId: string;
  onClose: () => void;
}

const ReadOnlyUserProfile: React.FC<ReadOnlyUserProfileProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Helper function for budget emojis
  const getBudgetEmoji = (budgetLevel: number | null): string => {
    if (budgetLevel === 1) return '💰';
    if (budgetLevel === 2) return '💰💰';
    if (budgetLevel === 3) return '💰💰💰';
    return 'Not specified';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setProfile(null); // Clear previous profile

      if (!userId) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, name, age, gender, languages, cuisines, budget, bio, avatar_url, created_at') // Select fields needed for display
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setProfile(data);
        } else {
          setError('Profile not found.');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]); // Re-fetch if userId changes

  const formatList = (list: string[] | null): string => {
    if (!list || list.length === 0) return 'N/A';
    return list.join(', ');
  };

  return (
    // Position to the left of the list popup with proper z-index
    <div className="absolute right-full mr-2 top-0 z-50" onClick={(e) => e.stopPropagation()}>
      {/* Modal Content - Slightly off-white, reduced padding, max height */}
      <div className="bg-gray-50 rounded-lg p-4 max-w-md w-[320px] relative shadow-xl max-h-[75vh] overflow-y-auto">
        {/* Close Button - Adjusted styling for visibility */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-xl leading-none z-10"
          aria-label="Close profile"
        >
          &times;
        </button>

        {loading && (
          <div className="text-center py-10">
            {/* Reduced spinner size */}
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading profile...</p>
          </div>
        )}

        {error && (
          // Reduced padding/margin
          <div className="text-center py-6">
            <p className="text-red-600 text-sm">Error: {error}</p>
            <button onClick={onClose} className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="flex flex-col h-full"> {/* Flex container for content + buttons */}
            {/* Profile Content Area - Takes available space */}
            {/* Further reduced space-y */}
            <div className="flex-grow space-y-2">
              {/* Name heading removed */}
              {/* Top Section: Avatar & Basic Info */}
              {/* Reduced spacing/padding */}
              {/* Further reduced padding-bottom */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 border-b pb-2">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <AvatarUpload
                    avatarUrl={profile.avatar_url}
                    uploading={false}
                    isReadOnly={true}
                    onClick={() => { if (profile.avatar_url) setIsImageModalOpen(true); }}
                    size={80} // Reduced avatar size
                  />
                  {/* Placeholder for rating or status if needed */}
                  {/* <p className="text-xs text-gray-500 mt-1">★★★★☆ (4.5/5)</p> */}
                </div>

                {/* Reduced text sizes */}
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-lg font-semibold text-gray-800 leading-tight">{profile.name || 'N/A'}</p> {/* Added leading-tight */}
                  <p className="text-xs text-gray-600 leading-tight"> {/* Added leading-tight */}
                    {profile.age ? `${profile.age} years old` : 'Age not specified'}
                    {profile.gender && ` • ${profile.gender}`}
                  </p>
                  {/* Member Since Removed */}
                   {/* Budget Info - Use Emoji */}
                   <p className="text-sm text-gray-600 mt-0.5 leading-tight"> {/* Reduced margin, added leading-tight */}
                    Budget: {getBudgetEmoji(profile.budget)}
                  </p>
                </div>
              </div>

              {/* Bio Section - Reduced spacing/text size */}
              {/* Bio Section - Corrected conditional rendering */}
              {profile.bio && (
                <div className="py-0.5"> {/* Further reduced padding */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-0.5 leading-tight">About Me</h3> {/* Reduced margin, added leading-tight */}
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-tight">{profile.bio}</p> {/* Added leading-tight */}
                </div>
              )}

              {/* Languages Section - Reduced spacing/text size */}
              {/* Further reduced padding */}
              <div className="py-0.5">
                <h3 className="text-sm font-semibold text-gray-700 mb-0.5 leading-tight">Languages Spoken</h3> {/* Reduced margin, added leading-tight */}
                <p className="text-xs text-gray-600 leading-tight">{formatList(profile.languages)}</p> {/* Added leading-tight */}
              </div>

              {/* Cuisines Section - Reduced spacing/text size */}
              {/* Further reduced padding */}
              <div className="py-0.5">
                <h3 className="text-sm font-semibold text-gray-700 mb-0.5 leading-tight">Favorite Cuisines</h3> {/* Reduced margin, added leading-tight */}
                <p className="text-xs text-gray-600 leading-tight">{formatList(profile.cuisines)}</p> {/* Added leading-tight */}
              </div>
            </div> {/* End Profile Content Area */}

            {/* Action Buttons Area - Pushed to bottom */}
            {/* Further reduced button spacing */}
            <div className="mt-3 pt-2 border-t border-gray-200 flex justify-center space-x-3 flex-shrink-0">
              <button
                type="button"
                className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
                // onClick={() => { /* TODO: Implement Meet Me action */ }}
              >
                Meet Me
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                // onClick={() => { /* TODO: Implement Chat action */ }}
              >
                Chat
              </button>
            </div>
          </div> // End Flex container
        )}

        {/* Image Modal for Avatar */}
        {isImageModalOpen && profile?.avatar_url && (
          <ImageModal
            imageUrl={profile.avatar_url}
            isOpen={isImageModalOpen} // Add isOpen prop
            onClose={() => setIsImageModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ReadOnlyUserProfile;

// Basic CSS for animation (add to your main CSS file e.g., index.css)
/*
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in-scale {
  animation: fadeInScale 0.2s ease-out forwards;
}
*/