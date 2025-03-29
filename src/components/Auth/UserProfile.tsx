import React, { useState, useEffect } from 'react'; // Import React
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
// Removed: import { useNavigate } from 'react-router-dom';

interface ProfileData {
  id: string;
  name: string;
  age: number | null;
  languages: string[] | null;
  cuisines: string[] | null;
  created_at: string | null;
}

// Define options for dropdowns (same as RegisterSlide3)
const languageOptions = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch'];
const cuisineOptions = ['Italienisch', 'Japanisch', 'Mexikanisch', 'Indisch'];

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

  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

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
        .select('id, name, age, languages, cuisines, created_at')
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdateMessage({ type: '', text: '' });
      
      if (!user?.id) return;

      // Only update languages and cuisines (name and age are not editable)
      const { error } = await supabase
        .from('profiles')
        .update({
          languages: selectedLanguages,
          cuisines: selectedCuisines,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await fetchProfile();
      setEditMode(false);
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    if (!user || !profile) return;

    // Use window.confirm for a simple confirmation dialog
    const confirmation = window.confirm(
      'Are you sure you want to delete your profile? This action cannot be undone and will remove all your data.'
    );

    if (confirmation) {
      try {
        setLoading(true);
        // 1. Delete profile data from 'profiles' table
        // Ensure RLS policy "Users can delete own profile" exists in Supabase
        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (profileDeleteError) throw profileDeleteError;

        // 2. Optionally delete related data (e.g., user_locations) if needed
        // Example:
        // const { error: locationDeleteError } = await supabase
        //   .from('user_locations')
        //   .delete()
        //   .eq('user_id', user.id);
        // if (locationDeleteError) console.error('Error deleting locations:', locationDeleteError);

        // 3. Delete the user from Supabase Auth
        // IMPORTANT: This requires elevated privileges and should ideally be handled
        // by a secure Supabase Edge Function ('rpc' call) to avoid exposing service keys
        // on the client-side. For this example, we'll log a warning and proceed with sign-out.
        // In a production app, implement a Supabase Function for this step.
        console.warn(`Profile data for user ${user.id} deleted. Auth user deletion should be handled server-side.`);
        // Example of calling a hypothetical function:
        // const { error: authDeleteError } = await supabase.rpc('delete_user_account');
        // if (authDeleteError) throw authDeleteError;


        // 4. Sign out the user locally
        await signOut();

        // 5. Redirect to home page or login page
        setUpdateMessage({ type: 'success', text: 'Profile deleted successfully.' });
        window.location.assign('/'); // Redirect using standard browser API

      } catch (error: any) {
        console.error('Error deleting profile:', error);
        setUpdateMessage({ type: 'error', text: error.message || 'Failed to delete profile' });
        setLoading(false); // Ensure loading state is reset on error
      }
      // No finally block needed here as navigation happens on success
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
        <div className="space-y-6">
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
            <p className="text-sm font-medium text-gray-500">Member Since</p>
            <p className="text-lg">
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString() 
                : 'Not available'}
            </p>
          </div>
          
          <button
            onClick={() => setEditMode(true)}
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
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={originalName} // Display original name
              disabled // Make non-editable
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" // Style as disabled
            />
             <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              value={originalAge} // Display original age
              disabled // Make non-editable
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed" // Style as disabled
            />
             <p className="mt-1 text-xs text-gray-500">Age cannot be changed</p>
          </div>

          {/* Languages Multi-Select */}
          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Languages I Speak
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]"> {/* Added min-height */}
              {selectedLanguages.map((lang) => (
                <div key={lang} className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm inline-flex items-center"> {/* Changed style */}
                  {lang}
                  <button
                    type="button"
                    className="ml-2 focus:outline-none text-blue-500 hover:text-blue-700" // Style button
                    onClick={() => removeLanguage(lang)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <select
                id="language"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use flex-grow
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
              >
                <option value="">Select Language...</option> {/* Changed placeholder */}
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang} disabled={selectedLanguages.includes(lang)}>
                    {lang}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled style
                onClick={addLanguage}
                disabled={!currentLanguage || selectedLanguages.includes(currentLanguage)}
              >
                Add
              </button>
            </div>
          </div>

          {/* Cuisines Multi-Select */}
          <div className="mb-6">
            <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
              Cuisines I Like
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]"> {/* Added min-height */}
              {selectedCuisines.map((cuisine) => (
                <div key={cuisine} className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm inline-flex items-center"> {/* Changed style */}
                  {cuisine}
                  <button
                    type="button"
                    className="ml-2 focus:outline-none text-green-500 hover:text-green-700" // Style button
                    onClick={() => removeCuisine(cuisine)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <select
                id="cuisine"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use flex-grow
                value={currentCuisine}
                onChange={(e) => setCurrentCuisine(e.target.value)}
              >
                <option value="">Select Cuisine...</option> {/* Changed placeholder */}
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine} disabled={selectedCuisines.includes(cuisine)}>
                    {cuisine}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled style
                onClick={addCuisine}
                disabled={!currentCuisine || selectedCuisines.includes(currentCuisine)}
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                // Reset multi-select state to current profile values when cancelling
                if (profile) {
                  setSelectedLanguages(profile.languages || []);
                  setSelectedCuisines(profile.cuisines || []);
                  setCurrentLanguage('');
                  setCurrentCuisine('');
                }
                setUpdateMessage({ type: '', text: '' }); // Clear any previous messages
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
