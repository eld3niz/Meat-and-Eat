import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options'; // Keep if needed for display formatting
import AvatarUpload from '../Auth/AvatarUpload'; // Reusing the avatar component
import ImageModal from '../UI/ImageModal'; // For viewing avatar fullscreen

// Define the profile data structure needed for display
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
  // Add location if needed, but fetching might require adjustments
  // home_latitude: number | null;
  // home_longitude: number | null;
  // home_location_last_updated: string | null;
  // travel_status might not be directly available or relevant for other users here
}

interface UserProfilePopupProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function for budget emojis (copied from ReadOnlyUserProfile)
const getBudgetEmoji = (budgetLevel: number | null): string => {
    if (budgetLevel === 1) return '💰';
    if (budgetLevel === 2) return '💰💰';
    if (budgetLevel === 3) return '💰💰💰';
    return 'Not specified';
};

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // State for avatar URL

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setProfile(null); // Clear previous profile

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
          setAvatarUrl(data.avatar_url); // Set avatar URL state
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

    if (isOpen && userId) {
      fetchProfile();
    }
  }, [userId, isOpen]); // Re-fetch if userId or isOpen changes

  const formatList = (list: string[] | null): string => {
    if (!list || list.length === 0) return 'N/A';
    return list.join(', ');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative mx-4" // Adjusted max-width and added margin
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold z-10"
          aria-label="Close profile"
        >
          &times;
        </button>

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading profile...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-red-600">Error: {error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          // --- VIEW MODE CONTENT (Adapted from UserProfile.tsx) ---
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">{profile.name || 'User Profile'}</h2>
            <div className="space-y-4 p-1">
              {/* Top Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 border-b pb-4 mb-4">
                {/* Left Column: Avatar & Placeholder Rating */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <AvatarUpload
                    avatarUrl={avatarUrl}
                    uploading={false}
                    isReadOnly={true}
                    onClick={() => { if (avatarUrl) setIsImageModalOpen(true); }}
                    size={80}
                  />
                  {/* Placeholder for rating if desired */}
                  {/* <p className="text-xs text-gray-500 mt-1">★★★★☆ (4.5/5)</p> */}
                </div>

                {/* Right Column: Basic Info */}
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-xl font-semibold text-gray-800">{profile.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {profile.age ? `${profile.age} years old` : 'Age not specified'}
                    {profile.gender && ` • ${profile.gender}`}
                  </p>
                  {/* Displaying 'Member Since' might be less relevant here, but possible */}
                  {profile.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Member since: {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  )}
                   <p className="text-sm text-gray-600 mt-1">
                     Budget: {getBudgetEmoji(profile.budget)}
                   </p>
                  {/* Placeholder for User Status if needed/possible */}
                  {/* <p className="text-sm text-gray-600 mt-1">Status: {renderUserStatus(...)}</p> */}
                </div>
              </div>

              {/* Bio Section */}
              {profile.bio && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">About Me</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Languages Section */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Languages Spoken</h3>
                <p className="text-sm text-gray-600">{formatList(profile.languages)}</p>
              </div>

              {/* Cuisines Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Favorite Cuisines</h3>
                <p className="text-sm text-gray-600">{formatList(profile.cuisines)}</p>
              </div>
            </div>
            {/* Add "Meet Me" or other relevant action buttons if desired */}
             <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
               <button
                 type="button"
                 className="px-5 py-2 bg-green-500 text-white text-base font-medium rounded shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                 // onClick={() => { /* TODO: Implement Meet Me action */ }}
               >
                 Meet Me
               </button>
             </div>
          </div>
        )}

        {/* Image Modal for Avatar */}
        {isImageModalOpen && avatarUrl && (
          <ImageModal
            imageUrl={avatarUrl}
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfilePopup;