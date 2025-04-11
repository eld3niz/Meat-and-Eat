import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options';
import AvatarUpload from '../Auth/AvatarUpload';
import ImageModal from '../UI/ImageModal';
import SimpleMessagePopup from '../UI/SimpleMessagePopup';

// Update the props interface to include currentUser
interface ReadOnlyUserProfileProps {
  userId: string;
  onClose?: () => void;
  travelStatus?: string;
  currentUser?: any; // Add currentUser prop
}

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
}

const ReadOnlyUserProfile: React.FC<ReadOnlyUserProfileProps> = ({ 
  userId, 
  onClose, 
  travelStatus,
  currentUser // Accept currentUser from props
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMeetupPopupOpen, setIsMeetupPopupOpen] = useState(false);

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
      setProfile(null);

      if (!userId) {
        setError('No user ID provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, name, age, gender, languages, cuisines, budget, bio, avatar_url, created_at')
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
  }, [userId]);

  const formatList = (list: string[] | null): string => {
    if (!list || list.length === 0) return 'N/A';
    return list.join(', ');
  };

  // Handler for Meet Me button click
  const handleMeetMeClick = () => {
    if (!currentUser) {
      alert('You need to be logged in to propose meetups.');
      return;
    }
    setIsMeetupPopupOpen(true);
  };

  // Only show the Meet Me button if the user is authenticated
  const showMeetMeButton = !!currentUser && currentUser.id !== userId;

  return (
    <> 
    <div className="absolute right-full mr-2 top-0 z-50" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gray-50 rounded-lg p-4 max-w-md w-[320px] relative shadow-xl max-h-[75vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-xl leading-none z-10"
          aria-label="Close profile"
        >
          &times;
        </button>

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading profile...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-red-600 text-sm">Error: {error}</p>
            <button onClick={onClose} className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-0.5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-4 border-b pb-1">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <AvatarUpload
                    avatarUrl={profile.avatar_url}
                    uploading={false}
                    isReadOnly={true}
                    onClick={() => { if (profile.avatar_url) setIsImageModalOpen(true); }}
                    size={80}
                  />
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <p className="text-lg font-semibold text-gray-800 leading-tight">{profile.name || 'N/A'}</p>
                  <p className="text-xs text-gray-600 leading-tight">
                    {profile.age ? `${profile.age} years old` : 'Age not specified'}
                    {profile.gender && ` • ${profile.gender}`}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight flex items-center">
                    <span className="mr-1">🌍</span>
                    {travelStatus || 'Explorer'}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight">
                    Budget: {getBudgetEmoji(profile.budget)}
                  </p>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 leading-tight">About Me</h3>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-tight">{profile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 leading-tight">Languages Spoken</h3>
                <p className="text-xs text-gray-600 leading-tight">{formatList(profile.languages)}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 leading-tight">Favorite Cuisines</h3>
                <p className="text-xs text-gray-600 leading-tight">{formatList(profile.cuisines)}</p>
              </div>
            </div>

            {showMeetMeButton && (
              <div className="mt-1 pt-1 border-t border-gray-200 flex justify-center flex-shrink-0">
                <button
                  type="button"
                  onClick={handleMeetMeClick}
                  className="px-4 py-1 bg-green-500 text-white text-sm font-medium rounded shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
                >
                  Meet Me
                </button>
              </div>
            )}
          </div>
        )}

        {isImageModalOpen && profile?.avatar_url && (
          <ImageModal
            imageUrl={profile.avatar_url}
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
          />
        )}
      </div>
    </div>

    {isMeetupPopupOpen && profile && currentUser && (
      <SimpleMessagePopup
        isOpen={isMeetupPopupOpen}
        onClose={() => setIsMeetupPopupOpen(false)}
        onSubmit={() => setIsMeetupPopupOpen(false)}
        userId={userId}
        userName={profile.name}
        user={currentUser}
      />
    )}
    </>
  );
};

export default ReadOnlyUserProfile;