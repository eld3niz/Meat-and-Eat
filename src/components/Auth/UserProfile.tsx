import React, { useState, useEffect } from 'react'; // Import React
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options';
import AvatarUpload from './AvatarUpload';
import ImageModal from '../UI/ImageModal'; // Import the ImageModal
// Removed: import { useNavigate } from 'react-router-dom';

interface ProfileData {
  id: string;
  name: string;
  age: number | null;
  languages: string[] | null;
  cuisines: string[] | null;
  created_at: string | null;
  // Added fields
  is_local: string | null;
  budget: number | null;
  bio: string | null;
  avatar_url: string | null; // Add avatar_url
}

const UserProfile = () => {
  const { user, signOut } = useAuth(); // Get signOut from context
  // Removed: const navigate = useNavigate();
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
  // State for new editable fields
  const [editIsLocal, setEditIsLocal] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<number | null>(null);
  const [editBio, setEditBio] = useState<string>('');

  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
  // State for avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Stores the currently SAVED avatar URL
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // For upload/remove status during save/remove
  // New state for edit mode preview & file selection
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreviewUrl, setEditAvatarPreviewUrl] = useState<string | null>(null);
  // State for password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
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
        // Select all required fields, including avatar_url
        .select('id, name, age, languages, cuisines, created_at, is_local, budget, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        // Set initial state for multi-select and original values
        setOriginalName(data.name || '');
        setOriginalAge(data.age?.toString() || '');
        setSelectedLanguages(data.languages || []);
        setSelectedCuisines(data.cuisines || []);
        // Set initial state for new editable fields
        setEditIsLocal(data.is_local);
        setEditBudget(data.budget);
        setEditBio(data.bio || '');
        // Set avatar state
        setAvatarUrl(data.avatar_url);
        setEditAvatarPreviewUrl(data.avatar_url); // Initialize preview with the currently saved URL
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


  // Handle Save Changes (including potential avatar upload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingAvatar(true); // Indicate loading for potential avatar ops
    setUpdateMessage({ type: '', text: '' });

    if (!user?.id) {
      setUploadingAvatar(false);
      return;
    }

    try {
      let newAvatarUrl = avatarUrl; // Start with the current URL
      let uploadedFilePath: string | null = null; // Track path for potential cleanup

      // 1. Handle Avatar Upload (if a new file was selected during edit)
      if (editAvatarFile) {
        const file = editAvatarFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`; // Random name
        const filePath = `${user.id}/${fileName}`;
        uploadedFilePath = filePath; // Store for potential cleanup

        // Perform the upload
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file); // Use plain upload, RLS handles permissions

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        // Get public URL after successful upload
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
          // Attempt cleanup if URL retrieval fails
          if (uploadedFilePath) await supabase.storage.from('avatars').remove([uploadedFilePath]);
          throw new Error('Failed to get public URL for uploaded avatar.');
        }
        newAvatarUrl = urlData.publicUrl; // This is the URL to save in the profile
      }

      // 2. Prepare Profile Data to Update
      // Include avatar_url only if a new file was successfully uploaded
      const profileUpdates: Partial<ProfileData> & { updated_at: string } = {
        languages: selectedLanguages,
        cuisines: selectedCuisines,
        is_local: editIsLocal,
        budget: editBudget,
        bio: editBio,
        updated_at: new Date().toISOString(),
        ...(editAvatarFile && { avatar_url: newAvatarUrl }), // Conditionally add avatar_url
      };

      // 3. Update Profile Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        // If profile update fails after a *new* avatar was uploaded, try removing the orphaned file
        if (editAvatarFile && uploadedFilePath) {
           console.warn('Profile update failed after avatar upload. Attempting to remove orphaned avatar:', uploadedFilePath);
           await supabase.storage.from('avatars').remove([uploadedFilePath]);
        }
        throw profileError; // Throw the original profile update error
      }

      // 4. Update Local State (Crucial for immediate UI update)
      setAvatarUrl(newAvatarUrl); // Update the main display URL state
      // Update profile state - merge existing profile with updates and the potentially new avatar URL
      setProfile(prev => prev ? { ...prev, ...profileUpdates, avatar_url: newAvatarUrl } : null);
      setEditAvatarFile(null); // Clear the selected file state
      setEditAvatarPreviewUrl(newAvatarUrl); // Ensure preview matches the new saved URL

      setEditMode(false); // Exit edit mode
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });

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

        // 2. Optionally delete avatar from storage (best effort)
        if (avatarUrl) {
           try {
             // Attempt to extract path - THIS IS FRAGILE, depends on URL structure
             const urlParts = avatarUrl.split('/avatars/');
             if (urlParts.length > 1) {
               const filePath = urlParts[1];
               console.log('Attempting to remove avatar from storage:', filePath);
               await supabase.storage.from('avatars').remove([filePath]);
             }
           } catch (storageError) {
             console.error("Failed to remove avatar from storage during profile deletion:", storageError);
             // Don't block profile deletion if storage removal fails
           }
        }

        // 3. Delete Auth User (Requires server-side handling or elevated privileges)
        console.warn(`Profile data for user ${user.id} deleted. Auth user deletion should be handled server-side.`);
        // const { error: authDeleteError } = await supabase.rpc('delete_user_account');
        // if (authDeleteError) throw authDeleteError;

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

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordUpdateMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordUpdateMessage({ type: 'error', text: 'New passwords do not match.' });
      setPasswordLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordUpdateMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordUpdateMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordUpdateMessage({ type: 'error', text: error.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle avatar file SELECTION and preview generation
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateMessage({ type: '', text: '' });
    setEditAvatarFile(null); // Reset file state initially
    // Don't reset preview here, let it show the old one until new one loads

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Validation
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

      // Set file state
      setEditAvatarFile(file);

      // Generate preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarPreviewUrl(reader.result as string); // Update preview
      };
      reader.readAsDataURL(file);

    } else {
        // If selection was cancelled, reset preview to current saved URL
        setEditAvatarPreviewUrl(avatarUrl);
    }
    // Reset input value so the same file can be selected again
    event.target.value = '';
  };

   // Handle removing the avatar
   const handleRemoveAvatar = async () => {
    // Can only remove if there's a currently saved avatar URL or a preview URL
    if (!user?.id || !editAvatarPreviewUrl) return;

    const confirmation = window.confirm("Are you sure you want to remove your profile picture?");
    if (!confirmation) return;

    setUploadingAvatar(true); // Use same loading state
    setUpdateMessage({ type: '', text: '' });

    try {
      // 1. Update profile table to set avatar_url to null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Attempt to remove file from storage (best effort, path extraction is fragile)
      // Only attempt removal if there was a previously saved avatarUrl
      if (avatarUrl) {
        try {
          const urlParts = avatarUrl.split('/avatars/'); // Assumes '/avatars/' is in the path
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            console.log('Attempting to remove avatar file from storage:', filePath);
            await supabase.storage.from('avatars').remove([filePath]);
          } else {
            console.warn("Could not extract file path from avatar URL for removal:", avatarUrl);
          }
        } catch (storageError) {
          console.error("Error removing avatar file from storage (proceeding anyway):", storageError);
          // Don't block the UI update if storage removal fails
        }
      }

      // 3. Update local state immediately for UI feedback
      setAvatarUrl(null); // Clear the saved URL state
      setEditAvatarPreviewUrl(null); // Clear the preview
      setEditAvatarFile(null); // Clear any selected file
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null); // Update profile state
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
            updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {updateMessage.text}
        </div>
      )}

      {!editMode ? (
        // --- VIEW MODE ---
        <div className="space-y-6">
          {/* Avatar Display (View Mode) - Opens modal */}
          <div className="flex justify-center mb-4">
             <AvatarUpload
               avatarUrl={avatarUrl}
               uploading={false}
               isReadOnly={true}
               onClick={() => { if (avatarUrl) setIsImageModalOpen(true); }} // Open modal on click if URL exists
               size={120}
             />
           </div>

          {/* Profile Fields Display */}
           <div className="border-b pb-3">
             <p className="text-sm font-medium text-gray-500">Email</p>
             <p className="text-lg">{user?.email}</p>
           </div>
           <div className="border-b pb-3">
             <p className="text-sm font-medium text-gray-500">Name</p>
             <p className="text-lg">{profile?.name || 'Not specified'}</p>
           </div>
           <div className="border-b pb-3">
             <p className="text-sm font-medium text-gray-500">Age</p>
             <p className="text-lg">{profile?.age || 'Not specified'}</p>
           </div>
           <div className="border-b pb-3">
             <p className="text-sm font-medium text-gray-500">Languages I Speak</p>
             <p className="text-lg">
               {profile?.languages && profile.languages.length > 0
                 ? profile.languages.join(', ')
                 : 'Not specified'}
             </p>
           </div>
           <div className="border-b pb-3">
             <p className="text-sm font-medium text-gray-500">Cuisines I Like</p>
             <p className="text-lg">
               {profile?.cuisines && profile.cuisines.length > 0
                 ? profile.cuisines.join(', ')
                 : 'Not specified'}
            </p>
          </div>
          <div className="border-b pb-3">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-lg">{profile?.is_local ? (profile.is_local === 'local' ? 'Local' : 'Traveler') : 'Not specified'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="text-sm font-medium text-gray-500">Budget</p>
            <p className="text-lg">{profile?.budget ? `Level ${profile.budget}` : 'Not specified'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="text-sm font-medium text-gray-500">Bio</p>
            <p className="text-lg whitespace-pre-wrap">{profile?.bio || 'Not specified'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="text-sm font-medium text-gray-500">Member Since</p>
            <p className="text-lg">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'Not available'}
            </p>
          </div>
          {/* End Profile Fields Display */}

          <button
             onClick={() => { // Explicitly set state when entering edit mode
                 setEditMode(true);
                 setEditAvatarPreviewUrl(avatarUrl);
                 setEditAvatarFile(null);
                 setUpdateMessage({ type: '', text: '' });
             }}
             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
           >
             Edit Profile
           </button>

          {/* Delete Profile Button/Text */}
          <div className="text-right mt-4">
            <button
              onClick={handleDeleteProfile}
              className="text-sm text-red-600 hover:text-red-800 hover:underline focus:outline-none"
            >
              Delete My Profile
            </button>
          </div>

          {/* --- Password Change Section --- */}
          <div className="mt-6 pt-6 border-t">
            {!showPasswordChange ? (
              <button
                onClick={() => {
                  setShowPasswordChange(true);
                  setPasswordUpdateMessage({ type: '', text: '' });
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Change Password</h3>
                {passwordUpdateMessage.text && (
                  <div
                    className={`p-3 rounded ${
                      passwordUpdateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {passwordUpdateMessage.text}
                  </div>
                )}
                {/* Password Inputs (Condensed for brevity) */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input id="newPassword" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter new password (min. 6 characters)" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Confirm new password" />
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={passwordLoading} className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50">
                    {passwordLoading ? 'Saving...' : 'Save New Password'}
                  </button>
                  <button type="button" onClick={() => { setShowPasswordChange(false); setNewPassword(''); setConfirmPassword(''); setPasswordUpdateMessage({ type: '', text: '' }); }} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          {/* --- End Password Change Section --- */}

        </div>
      ) : (
        // --- EDIT MODE ---
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload/Preview (Edit Mode) */}
          <div className="flex flex-col items-center mb-6 space-y-2">
            <AvatarUpload
              avatarUrl={editAvatarPreviewUrl} // Show the preview URL during edit
              uploading={uploadingAvatar} // Indicate status during save/remove operations
              onUpload={handleAvatarSelect} // Connect the SELECT handler
              size={120}
            />
            {/* Show Remove button only if there's a preview URL */}
            {editAvatarPreviewUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar} // Connect the remove handler
                disabled={uploadingAvatar} // Disable while saving/removing
                className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Avatar
              </button>
            )}
          </div>

          {/* Profile Edit Fields (Condensed for brevity) */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
             <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100" />
             <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
           </div>
           <div>
             <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
             <input id="name" name="name" type="text" value={originalName} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" />
             <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
           </div>
           <div>
             <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
             <input id="age" name="age" type="number" value={originalAge} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" />
             <p className="mt-1 text-xs text-gray-500">Age cannot be changed</p>
           </div>
           {/* Languages Multi-Select */}
           <div className="mb-4">
             <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Languages I Speak</label>
             <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]">
               {selectedLanguages.map((lang) => (
                 <div key={lang} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm inline-flex items-center">
                   {lang}
                   <button type="button" onClick={() => removeLanguage(lang)} className="ml-2 focus:outline-none text-blue-500 hover:text-blue-700">
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>
               ))}
             </div>
             <div className="flex">
               <select id="language" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={currentLanguage} onChange={(e) => setCurrentLanguage(e.target.value)}>
                 <option value="">Select Language...</option>
                 {languageOptions.map((lang) => (
                   <option key={lang} value={lang} disabled={selectedLanguages.includes(lang)}>
                     {lang}
                   </option>
                 ))}
               </select>
               <button type="button" className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" onClick={addLanguage} disabled={!currentLanguage || selectedLanguages.includes(currentLanguage)}>
                 Add
               </button>
             </div>
           </div>
           {/* Cuisines Multi-Select */}
           <div className="mb-6">
             <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">Cuisines I Like</label>
             <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]">
               {selectedCuisines.map((cuisine) => (
                 <div key={cuisine} className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm inline-flex items-center">
                   {cuisine}
                   <button type="button" onClick={() => removeCuisine(cuisine)} className="ml-2 focus:outline-none text-green-500 hover:text-green-700">
                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>
               ))}
             </div>
             <div className="flex">
               <select id="cuisine" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={currentCuisine} onChange={(e) => setCurrentCuisine(e.target.value)}>
                 <option value="">Select Cuisine...</option>
                 {cuisineOptions.map((cuisine) => (
                   <option key={cuisine} value={cuisine} disabled={selectedCuisines.includes(cuisine)}>
                     {cuisine}
                   </option>
                 ))}
               </select>
               <button type="button" className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" onClick={addCuisine} disabled={!currentCuisine || selectedCuisines.includes(currentCuisine)}>
                 Add
               </button>
             </div>
           </div>
           {/* is_local Radio Buttons */}
           <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">Are you a Local or a Traveler?</label>
             <div className="flex items-center space-x-4">
               <label className="inline-flex items-center">
                 <input type="radio" name="is_local" value="local" checked={editIsLocal === 'local'} onChange={(e) => setEditIsLocal(e.target.value)} className="form-radio h-4 w-4 text-blue-600" />
                 <span className="ml-2 text-gray-700">Local</span>
               </label>
               <label className="inline-flex items-center">
                 <input type="radio" name="is_local" value="traveler" checked={editIsLocal === 'traveler'} onChange={(e) => setEditIsLocal(e.target.value)} className="form-radio h-4 w-4 text-blue-600" />
                 <span className="ml-2 text-gray-700">Traveler</span>
               </label>
               <label className="inline-flex items-center">
                 <input type="radio" name="is_local" value="" checked={editIsLocal === null || editIsLocal === ''} onChange={() => setEditIsLocal(null)} className="form-radio h-4 w-4 text-gray-400" />
                 <span className="ml-2 text-gray-500 italic">Clear</span>
               </label>
             </div>
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
          {/* End Profile Edit Fields */}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploadingAvatar || passwordLoading} // Disable save if avatar or password ops are in progress
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {uploadingAvatar ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { // Cancel Logic
                setEditMode(false);
                // Reset editable fields to original profile values
                if (profile) {
                  setSelectedLanguages(profile.languages || []);
                  setSelectedCuisines(profile.cuisines || []);
                  setEditIsLocal(profile.is_local);
                  setEditBudget(profile.budget);
                  setEditBio(profile.bio || '');
                }
                // Reset avatar edit state specifically
                setEditAvatarFile(null);
                setEditAvatarPreviewUrl(avatarUrl); // Reset preview to the actual current avatarUrl state
                // Reset dropdown helpers
                setCurrentLanguage('');
                setCurrentCuisine('');
                setUpdateMessage({ type: '', text: '' }); // Clear any previous messages
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Cancel Profile Edit
            </button>
          </div>
        </form>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={avatarUrl} // Pass the current avatar URL
      />
    </div>
  );
};

export default UserProfile;
