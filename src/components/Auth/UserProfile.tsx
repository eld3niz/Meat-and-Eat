import React, { useState, useEffect } from 'react'; // Import React
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options';
import AvatarUpload from './AvatarUpload';
import ImageModal from '../UI/ImageModal';
import LocationSearchMap from '../Map/LocationSearchMap'; // Import the map component
import { useUserStatus, UserStatus } from '../../hooks/useUserStatus'; // Import the status hook

interface ProfileData {
  id: string;
  name: string;
  age: number | null;
  languages: string[] | null;
  cuisines: string[] | null;
  created_at: string | null;
  // Modified/Added fields
  budget: number | null;
  bio: string | null;
  avatar_url: string | null;
  home_latitude: number | null; // New field
  home_longitude: number | null; // New field
  home_location_last_updated: string | null; // New field (timestamp as string)
}

// Helper function to render status with appropriate emoji
const renderUserStatus = (status: UserStatus) => {
  switch (status) {
    case 'Local':
      return 'Local 🏠';
    case 'Traveller':
      return 'Traveller ✈️';
    case 'Other':
      return 'Other (Home not set)';
    case 'Loading':
      return 'Loading status...';
    case 'Unknown':
    default:
      return 'Status Unknown';
  }
};


const UserProfile = () => {
  const { user, signOut } = useAuth(); // Get signOut from context
  const { status: userStatus, error: statusError } = useUserStatus(); // Use the status hook
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  // State for multi-select dropdowns
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [currentCuisine, setCurrentCuisine] = useState('');
  // Keep original name/age for display in edit mode (non-editable)
  const [originalName, setOriginalName] = useState('');
  const [originalAge, setOriginalAge] = useState('');
  // State for editable fields
  const [editBudget, setEditBudget] = useState<number | null>(null);
  const [editBio, setEditBio] = useState<string>('');
  // State for home location editing
  const [editHomeLatitude, setEditHomeLatitude] = useState<number | null>(null);
  const [editHomeLongitude, setEditHomeLongitude] = useState<number | null>(null);
  const [editHomeLocationLastUpdated, setEditHomeLocationLastUpdated] = useState<string | null>(null);
  const [editLocationChanged, setEditLocationChanged] = useState(false); // Track if location was changed in edit mode

  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
  // State for avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Stores the currently SAVED avatar URL
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // For upload/remove status during save/remove
  // New state for edit mode preview & file selection
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreviewUrl, setEditAvatarPreviewUrl] = useState<string | null>(null);
  // State for password change (integrated into main form)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // State for image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, age, languages, cuisines, created_at, budget, bio, avatar_url, home_latitude, home_longitude, home_location_last_updated') // Select new fields
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setOriginalName(data.name || '');
        setOriginalAge(data.age?.toString() || '');
        setSelectedLanguages(data.languages || []);
        setSelectedCuisines(data.cuisines || []);
        // setEditIsLocal removed
        setEditBudget(data.budget);
        setEditBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
        setEditAvatarPreviewUrl(data.avatar_url);
        // Set initial edit state for location
        setEditHomeLatitude(data.home_latitude);
        setEditHomeLongitude(data.home_longitude);
        setEditHomeLocationLastUpdated(data.home_location_last_updated);
        setEditLocationChanged(false); // Reset change tracker on fetch
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for multi-select dropdowns
  const addLanguage = () => {
    if (currentLanguage && !selectedLanguages.includes(currentLanguage)) {
      setSelectedLanguages([...selectedLanguages, currentLanguage]);
      setCurrentLanguage('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setSelectedLanguages(selectedLanguages.filter((lang) => lang !== languageToRemove));
  };

  const addCuisine = () => {
    if (currentCuisine && !selectedCuisines.includes(currentCuisine)) {
      setSelectedCuisines([...selectedCuisines, currentCuisine]);
      setCurrentCuisine('');
    }
  };

  const removeCuisine = (cuisineToRemove: string) => {
    setSelectedCuisines(selectedCuisines.filter((cuisine) => cuisine !== cuisineToRemove));
  };

  // Handle Home Location selection in edit mode
  const handleLocationSelect = (lat: number, lng: number) => {
    setEditHomeLatitude(lat);
    setEditHomeLongitude(lng);
    setEditLocationChanged(true); // Mark location as changed
  };

  // Handle Save Changes (including potential avatar, password, and location updates)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingAvatar(true); // Indicate loading for potential avatar/password ops
    setUpdateMessage({ type: '', text: '' });

    if (!user?.id) {
      setUploadingAvatar(false);
      return;
    }

    // --- Password Validation (only if fields are filled) ---
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setUpdateMessage({ type: 'error', text: 'New passwords do not match.' });
        setUploadingAvatar(false); // Stop loading
        return;
      }
      if (newPassword.length < 6) {
        setUpdateMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        setUploadingAvatar(false); // Stop loading
        return;
      }
    }
    // --- End Password Validation ---

    try {
      let newAvatarUrl = avatarUrl;
      let uploadedFilePath: string | null = null;
      let locationUpdateMessage: string | null = null; // To store result from RPC call

      // --- Location Update Check & Call (if changed) ---
      if (editLocationChanged && editHomeLatitude !== null && editHomeLongitude !== null) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('update_home_location', {
          p_latitude: editHomeLatitude,
          p_longitude: editHomeLongitude
        });

        if (rpcError) {
          // Throw error to be caught below, preventing further updates if location save fails
          throw new Error(`Failed to update home location: ${rpcError.message}`);
        } else {
          locationUpdateMessage = rpcResult; // Store the message from the function
          // If update was successful, update the local timestamp state and reset change tracker
          if (locationUpdateMessage && locationUpdateMessage.includes('successfully')) {
            setEditHomeLocationLastUpdated(new Date().toISOString()); // Approximate, ideally re-fetch
            setEditLocationChanged(false);
          } else {
             // If the function returned a failure message (e.g., rate limit), show it and stop
             setUpdateMessage({ type: 'warning', text: locationUpdateMessage || 'Could not update location.' });
             setUploadingAvatar(false);
             return; // Stop the rest of the save process
          }
        }
      }
      // --- End Location Update ---

      // 1. Handle Avatar Upload (if a new file was selected during edit)
      if (editAvatarFile) {
        const file = editAvatarFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`; // Random name
        const filePath = `${user.id}/${fileName}`;
        uploadedFilePath = filePath; // Store for potential cleanup

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
          if (uploadedFilePath) await supabase.storage.from('avatars').remove([uploadedFilePath]);
          throw new Error('Failed to get public URL for uploaded avatar.');
        }
        newAvatarUrl = urlData.publicUrl;
      }

      // 2. Prepare Profile Data to Update (excluding location fields handled by RPC)
      const profileUpdates: Partial<Omit<ProfileData, 'home_latitude' | 'home_longitude' | 'home_location_last_updated'>> & { updated_at: string } = {
        languages: selectedLanguages,
        cuisines: selectedCuisines,
        // is_local removed
        budget: editBudget,
        bio: editBio,
        updated_at: new Date().toISOString(),
        ...(editAvatarFile && { avatar_url: newAvatarUrl }), // Conditionally add avatar_url if a new one was uploaded
      };

      // 3. Update Profile Table (only non-location fields)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        if (editAvatarFile && uploadedFilePath) {
           console.warn('Profile update failed after avatar upload. Attempting to remove orphaned avatar:', uploadedFilePath);
           await supabase.storage.from('avatars').remove([uploadedFilePath]);
        }
        throw profileError;
      }

      // 4. Update Password (if new password was provided and valid)
      let passwordUpdateError = null;
      if (newPassword) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdError) {
          console.error("Password update failed during profile save:", pwdError);
          passwordUpdateError = pwdError;
        }
      }

      // 5. Update Local State (Profile data excluding location, which is handled by RPC/re-fetch)
      setAvatarUrl(newAvatarUrl);
      // Update profile state carefully, preserving potentially updated location info if we don't re-fetch immediately
      setProfile(prev => {
          if (!prev) return null;
          // Create a new profile object with updates, but keep existing location data for now
          const updatedProfileBase = { ...prev, ...profileUpdates, avatar_url: newAvatarUrl };
          // If location was successfully updated, reflect the new timestamp (or re-fetch for accuracy)
          if (locationUpdateMessage?.includes('successfully')) {
              updatedProfileBase.home_location_last_updated = editHomeLocationLastUpdated; // Use state value updated after RPC call
          }
          return updatedProfileBase as ProfileData; // Cast might be needed depending on exact types
      });
      setEditAvatarFile(null);
      setEditAvatarPreviewUrl(newAvatarUrl);
      setNewPassword('');
      setConfirmPassword('');

      setEditMode(false); // Exit edit mode

      // Determine final success/warning message, considering location update result
      let finalMessage = '';
      let finalType: 'success' | 'warning' = 'success';

      if (locationUpdateMessage?.includes('successfully')) {
          finalMessage = 'Profile and home location updated successfully!';
      } else {
          finalMessage = 'Profile updated successfully!'; // Location wasn't changed or failed earlier
      }

      if (passwordUpdateError) {
          finalMessage += `\nPassword change failed: ${passwordUpdateError.message}`;
          finalType = 'warning';
      } else if (newPassword) {
          finalMessage += '\nPassword updated successfully!';
      }

      setUpdateMessage({ type: finalType, text: finalMessage });

      // Optionally re-fetch profile data here to ensure timestamp is accurate
      // fetchProfile();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setUploadingAvatar(false); // Finish loading indicator
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    if (!user || !profile) return;

    const confirmation = window.confirm(
      'Are you sure you want to delete your profile? This action cannot be undone and will remove all your data.'
    );

    if (confirmation) {
      try {
        setLoading(true);
        // 1. Delete profile data
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
        if (profileDeleteError) throw profileDeleteError;

        // 2. Optionally delete avatar from storage
        if (avatarUrl) {
           try {
             const urlParts = avatarUrl.split('/avatars/');
             if (urlParts.length > 1) {
               const filePath = urlParts[1];
               await supabase.storage.from('avatars').remove([filePath]);
             }
           } catch (storageError) {
             console.error("Failed to remove avatar from storage during profile deletion:", storageError);
           }
        }

        // 3. Delete Auth User (Requires server-side handling or elevated privileges)
        console.warn(`Profile data for user ${user.id} deleted. Auth user deletion should be handled server-side.`);

        // 4. Sign out locally
        await signOut();

        // 5. Redirect
        setUpdateMessage({ type: 'success', text: 'Profile deleted successfully.' });
        window.location.assign('/');

      } catch (error: any) {
        console.error('Error deleting profile:', error);
        setUpdateMessage({ type: 'error', text: error.message || 'Failed to delete profile' });
        setLoading(false);
      }
    }
  };

  // Handle avatar file SELECTION and preview generation
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateMessage({ type: '', text: '' });
    setEditAvatarFile(null);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setUpdateMessage({ type: 'error', text: 'Invalid file type (PNG, JPG, GIF only).' });
        event.target.value = '';
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setUpdateMessage({ type: 'error', text: 'File too large (Max 5MB).' });
        event.target.value = '';
        return;
      }

      setEditAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

    } else {
        setEditAvatarPreviewUrl(avatarUrl);
    }
    event.target.value = '';
  };

   // Handle removing the avatar
   const handleRemoveAvatar = async () => {
    if (!user?.id || !editAvatarPreviewUrl) return;

    const confirmation = window.confirm("Are you sure you want to remove your profile picture?");
    if (!confirmation) return;

    setUploadingAvatar(true);
    setUpdateMessage({ type: '', text: '' });

    try {
      // 1. Update profile table to set avatar_url to null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Attempt to remove file from storage
      if (avatarUrl) {
        try {
          const urlParts = avatarUrl.split('/avatars/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('avatars').remove([filePath]);
          } else {
            console.warn("Could not extract file path from avatar URL for removal:", avatarUrl);
          }
        } catch (storageError) {
          console.error("Error removing avatar file from storage (proceeding anyway):", storageError);
        }
      }

      // 3. Update local state
      setAvatarUrl(null);
      setEditAvatarPreviewUrl(null);
      setEditAvatarFile(null);
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      setUpdateMessage({ type: 'success', text: 'Avatar removed.' });

    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setUpdateMessage({ type: 'error', text: error.message || 'Failed to remove avatar.' });
    } finally {
      setUploadingAvatar(false);
    }
  };


  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">My Profile</h2>

      {updateMessage.text && (
        <div
          className={`p-3 mb-4 rounded ${
            updateMessage.type === 'success' ? 'bg-green-100 text-green-700' :
            updateMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}
        >
          {updateMessage.text}
        </div>
      )}

      {!editMode ? (
        // --- VIEW MODE ---
        <div className="space-y-4 p-1">
          {/* Top Section */}
          <div className="flex items-start space-x-4">
            {/* Left Column: Avatar & Rating */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <AvatarUpload
                avatarUrl={avatarUrl}
                uploading={false}
                isReadOnly={true}
                onClick={() => { if (avatarUrl) setIsImageModalOpen(true); }}
                size={80}
              />
              <p className="text-xs text-gray-500 mt-1">★★★★☆ (4.5/5)</p> {/* Placeholder */}
            </div>

            {/* Right Column: Info */}
            <div className="flex-grow space-y-1">
              <h3 className="text-xl font-semibold flex items-center">
                {profile?.name || 'User Name'}
                <span className="ml-2">🇩🇪</span> {/* Placeholder */}
              </h3>
              <p className="text-sm text-gray-600">{profile?.age ? `${profile.age} yrs` : 'Age not specified'}</p>
              {/* Display dynamic status */}
              <p className="text-sm text-gray-600">
                Status: {renderUserStatus(userStatus)}
                {statusError && <span className="text-red-500 text-xs ml-2">({statusError})</span>}
              </p>
              <p className="text-sm text-gray-600">
                Budget: {profile?.budget === 1 ? '💰' : profile?.budget === 2 ? '💰💰' : profile?.budget === 3 ? '💰💰💰' : 'Not specified'}
              </p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bio Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Bio:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
              {profile?.bio || 'No bio provided.'}
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Details Section */}
          <div className="space-y-1">
             <p className="text-sm text-gray-600">
                🗣️ <span className="font-medium">Speaks:</span>{' '}
                {profile?.languages && profile.languages.length > 0
                  ? profile.languages.join(', ')
                  : 'Not specified'}
              </p>
              <p className="text-sm text-gray-600">
                🍜 <span className="font-medium">Likes:</span>{' '}
                {profile?.cuisines && profile.cuisines.length > 0
                  ? profile.cuisines.join(', ')
                  : 'Not specified'}
              </p>
          </div>

          <hr className="border-gray-200" />

          {/* Buttons Section */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-200 text-sm font-medium flex items-center justify-center space-x-1"
            >
              <span>💬</span>
              <span>Chat</span>
            </button>
            <button
              type="button"
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg shadow hover:bg-green-600 transition duration-200 text-sm font-medium flex items-center justify-center space-x-1"
            >
               <span>🤝</span>
               <span>Meet Me</span>
            </button>
          </div>

          <div className="mt-6 text-center">
             <button
               onClick={() => { // Enter edit mode
                   setEditMode(true);
                   setEditAvatarPreviewUrl(avatarUrl);
                   setEditAvatarFile(null);
                   setNewPassword('');
                   setConfirmPassword('');
                   setUpdateMessage({ type: '', text: '' });
                   // Reset location edit state as well
                   setEditHomeLatitude(profile?.home_latitude ?? null);
                   setEditHomeLongitude(profile?.home_longitude ?? null);
                   setEditHomeLocationLastUpdated(profile?.home_location_last_updated ?? null);
                   setEditLocationChanged(false);
               }}
               className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
             >
               Edit My Profile
             </button>
           </div>
           {/* TODO: Add Delete Profile button here if needed */}
        </div>

      ) : (
        // --- EDIT MODE ---
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload/Preview (Edit Mode) */}
          <div className="flex flex-col items-center mb-6 space-y-2">
            <AvatarUpload
              avatarUrl={editAvatarPreviewUrl} // Show the preview URL during edit
              uploading={uploadingAvatar}
              onUpload={handleAvatarSelect}
              size={120}
            />
            {editAvatarPreviewUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                Remove Picture
              </button>
            )}
          </div>

          {/* Name & Age (Non-Editable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-800">{originalName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <p className="text-gray-800">{originalAge || 'Not set'}</p>
            </div>
          </div>

          {/* Languages Multi-Select */}
          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
            <div className="flex">
              <select id="language" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)}>
                <option value="">Add Language...</option>
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <button type="button" onClick={addLanguage} className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">+</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedLanguages.map((lang) => (
                <span key={lang} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lang}
                  <button type="button" onClick={() => removeLanguage(lang)} className="ml-1.5 flex-shrink-0 text-blue-500 hover:text-blue-700 focus:outline-none">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Cuisines Multi-Select */}
          <div className="mb-4">
            <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">Favorite Cuisines</label>
            <div className="flex">
              <select id="cuisine" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={currentCuisine} onChange={(e) => setCurrentCuisine(e.target.value)}>
                <option value="">Add Cuisine...</option>
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
              <button type="button" onClick={addCuisine} className="ml-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCuisines.map((cuisine) => (
                <span key={cuisine} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {cuisine}
                  <button type="button" onClick={() => removeCuisine(cuisine)} className="ml-1.5 flex-shrink-0 text-green-500 hover:text-green-700 focus:outline-none">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

           {/* Home Location */}
           <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Home Location</label>
             <p className="text-xs text-gray-500 mb-2">
               Search or click to update your home location. Can be updated once per month.
               {editHomeLocationLastUpdated && (
                 <span className="block text-indigo-600">
                   Last updated: {new Date(editHomeLocationLastUpdated).toLocaleDateString()}
                 </span>
               )}
             </p>
             <LocationSearchMap
               initialLat={editHomeLatitude}
               initialLng={editHomeLongitude}
               onLocationSelect={handleLocationSelect}
               mapHeight="250px"
             />
             {/* Optional: Add logic here to disable map/show warning if update not allowed yet */}
           </div>

           {/* Budget Select */}
           <div className="mb-4">
             <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Budget Level (Optional)</label>
             <select id="budget" name="budget" value={editBudget ?? ''} onChange={(e) => setEditBudget(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
               <option value="">Select Budget...</option>
               <option value="1">Budget-friendly ($)</option>
               <option value="2">Mid-range ($$)</option>
               <option value="3">Premium ($$$)</option>
             </select>
             <p className="mt-1 text-xs text-gray-500">Indicate your typical spending preference for meetups.</p>
           </div>

           {/* Bio Textarea */}
           <div className="mb-6">
             <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional, max 255 characters)</label>
             <textarea id="bio" name="bio" rows={4} maxLength={255} value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Tell others a bit about yourself..." />
           </div>

           {/* Password Change Section */}
           <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Change Password (Optional)</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>
            </div>


           {/* Buttons */}
           <div className="flex space-x-3">
             <button
               type="submit"
               disabled={uploadingAvatar}
               className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
             >
               {uploadingAvatar ? 'Saving...' : 'Save Changes'}
             </button>
             <button
               type="button"
               onClick={() => { // Cancel Logic
                 setEditMode(false);
                 // Reset basic fields
                 setSelectedLanguages(profile?.languages || []);
                 setSelectedCuisines(profile?.cuisines || []);
                 setEditBudget(profile?.budget || null);
                 setEditBio(profile?.bio || '');
                 // Reset avatar preview
                 setEditAvatarPreviewUrl(avatarUrl);
                 setEditAvatarFile(null);
                 // Reset password fields
                 setNewPassword('');
                 setConfirmPassword('');
                 // Reset location fields and change tracker
                 setEditHomeLatitude(profile?.home_latitude ?? null);
                 setEditHomeLongitude(profile?.home_longitude ?? null);
                 setEditHomeLocationLastUpdated(profile?.home_location_last_updated ?? null);
                 setEditLocationChanged(false);
                 // Clear any messages
                 setUpdateMessage({ type: '', text: '' });
               }}
               className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
             >
               Cancel
             </button>
           </div>
        </form>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={avatarUrl}
      />
    </div>
  );
};

export default UserProfile;
