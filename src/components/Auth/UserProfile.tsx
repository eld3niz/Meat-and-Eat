import React, { useState, useEffect } from 'react'; // Import React
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
import { languageOptions, cuisineOptions } from '../../data/options';
import AvatarUpload from './AvatarUpload';
import ImageModal from '../UI/ImageModal'; // Import the ImageModal

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
        .select('id, name, age, languages, cuisines, created_at, is_local, budget, bio, avatar_url')
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
        setEditIsLocal(data.is_local);
        setEditBudget(data.budget);
        setEditBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
        setEditAvatarPreviewUrl(data.avatar_url);
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

  // Handle Save Changes (including potential avatar upload and password change)
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
      let newAvatarUrl = avatarUrl; // Start with the current URL
      let uploadedFilePath: string | null = null; // Track path for potential cleanup

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

      // 2. Prepare Profile Data to Update
      const profileUpdates: Partial<ProfileData> & { updated_at: string } = {
        languages: selectedLanguages,
        cuisines: selectedCuisines,
        is_local: editIsLocal,
        budget: editBudget,
        bio: editBio,
        updated_at: new Date().toISOString(),
        ...(editAvatarFile && { avatar_url: newAvatarUrl }), // Conditionally add avatar_url if a new one was uploaded
      };

      // 3. Update Profile Table
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

      // 5. Update Local State
      setAvatarUrl(newAvatarUrl);
      setProfile(prev => prev ? { ...prev, ...profileUpdates, avatar_url: newAvatarUrl } : null);
      setEditAvatarFile(null);
      setEditAvatarPreviewUrl(newAvatarUrl);
      setNewPassword(''); // Clear password fields on success/attempt
      setConfirmPassword('');

      setEditMode(false); // Exit edit mode

      // Determine success/warning message
      if (passwordUpdateError) {
          setUpdateMessage({ type: 'warning', text: `Profile updated, but password change failed: ${passwordUpdateError.message}` });
      } else if (newPassword) {
          setUpdateMessage({ type: 'success', text: 'Profile and password updated successfully!' });
      } else {
          setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      }

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
              <p className="text-sm text-gray-600">
                Status: {profile?.is_local === 'local' ? 'Local 🏠' : profile?.is_local === 'traveler' ? 'Traveler ✈️' : 'Not specified'}
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
                   setEditAvatarPreviewUrl(avatarUrl); // Reset preview to current saved
                   setEditAvatarFile(null); // Clear any previously selected file
                   setNewPassword(''); // Clear password fields when entering edit mode
                   setConfirmPassword('');
                   setUpdateMessage({ type: '', text: '' }); // Clear messages
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
                className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Avatar
              </button>
            )}
          </div>

          {/* Email (Non-Editable) */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
             <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100" />
             <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
           </div>

           {/* --- Change Password Section --- */}
           <div className="border-t border-gray-200 pt-6 mt-6">
             <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
             <p className="text-sm text-gray-500 mb-4">Leave these fields blank to keep your current password.</p>
             <div className="space-y-4">
               <div>
                 <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                 <input
                   id="newPassword"
                   name="newPassword"
                   type="password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                   placeholder="Enter new password (min. 6 chars)"
                 />
               </div>
               <div>
                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                 <input
                   id="confirmPassword"
                   name="confirmPassword"
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                   placeholder="Confirm new password"
                 />
               </div>
             </div>
           </div>
           {/* --- End Change Password Section --- */}

           {/* Name (Non-Editable) */}
           <div>
             <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
             <input id="name" name="name" type="text" value={originalName} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" />
             <p className="mt-1 text-xs text-gray-500">Name cannot be changed.</p>
           </div>

           {/* Age (Non-Editable) */}
           <div>
             <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
             <input id="age" name="age" type="number" value={originalAge} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" />
             <p className="mt-1 text-xs text-gray-500">Age cannot be changed.</p>
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
                 // Reset editable fields to original profile values
                 if (profile) {
                   setSelectedLanguages(profile.languages || []);
                   setSelectedCuisines(profile.cuisines || []);
                   setEditIsLocal(profile.is_local);
                   setEditBudget(profile.budget);
                   setEditBio(profile.bio || '');
                 }
                 setEditAvatarFile(null);
                 setEditAvatarPreviewUrl(avatarUrl);
                 setCurrentLanguage('');
                 setCurrentCuisine('');
                 setUpdateMessage({ type: '', text: '' });
                 // Also clear password fields on cancel
                 setNewPassword('');
                 setConfirmPassword('');
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
