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
    // Modal Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm" onClick={onClose}>
      {/* Modal Content - stop propagation to prevent closing when clicking inside */}
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-xl animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold z-10"
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
          <div className="text-center py-10">
            <p className="text-red-600">Error: {error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Close
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">{profile.name || 'User Profile'}</h2>
            <div className="space-y-4">
              {/* Top Section: Avatar & Basic Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 border-b pb-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <AvatarUpload
                    avatarUrl={profile.avatar_url}
                    uploading={false}
                    isReadOnly={true}
                    onClick={() => { if (profile.avatar_url) setIsImageModalOpen(true); }}
                    size={100} // Slightly larger avatar
                  />
                  {/* Placeholder for rating or status if needed */}
                  {/* <p className="text-xs text-gray-500 mt-1">★★★★☆ (4.5/5)</p> */}
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <p className="text-xl font-semibold text-gray-800">{profile.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {profile.age ? `${profile.age} years old` : 'Age not specified'}
                    {profile.gender && ` • ${profile.gender}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                   {/* Budget Info */}
                   <p className="text-sm text-gray-600 mt-2">
                    Budget: {profile.budget ? `~€${profile.budget} per meal` : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              {profile.bio && (
                <div className="py-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-1">About Me</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Languages Section */}
              <div className="py-2">
                <h3 className="text-md font-semibold text-gray-700 mb-1">Languages Spoken</h3>
                <p className="text-sm text-gray-600">{formatList(profile.languages)}</p>
              </div>

              {/* Cuisines Section */}
              <div className="py-2">
                <h3 className="text-md font-semibold text-gray-700 mb-1">Favorite Cuisines</h3>
                <p className="text-sm text-gray-600">{formatList(profile.cuisines)}</p>
              </div>

            </div>
          </>
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