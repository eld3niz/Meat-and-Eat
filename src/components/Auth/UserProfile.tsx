import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';

interface ProfileData {
  id: string;
  name: string;
  age: number | null;
  languages: string[] | null;
  cuisines: string[] | null;
  created_at: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    languages: '',
    cuisines: ''
  });
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
        setFormData({
          name: data.name || '',
          age: data.age?.toString() || '',
          languages: data.languages?.join(', ') || '',
          cuisines: data.cuisines?.join(', ') || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdateMessage({ type: '', text: '' });
      
      if (!user?.id) return;

      // Convert comma-separated string to array for languages and cuisines
      const languages = formData.languages
        ? formData.languages.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];
      
      const cuisines = formData.cuisines
        ? formData.cuisines.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          languages,
          cuisines,
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
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">
              Languages I Speak
            </label>
            <input
              id="languages"
              name="languages"
              type="text"
              value={formData.languages}
              onChange={handleChange}
              placeholder="English, Spanish, French"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple languages with commas</p>
          </div>
          
          <div>
            <label htmlFor="cuisines" className="block text-sm font-medium text-gray-700 mb-1">
              Cuisines I Like
            </label>
            <input
              id="cuisines"
              name="cuisines"
              type="text"
              value={formData.cuisines}
              onChange={handleChange}
              placeholder="Italian, Japanese, Mexican"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple cuisines with commas</p>
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
                // Reset form data to current profile values
                if (profile) {
                  setFormData({
                    name: profile.name || '',
                    age: profile.age?.toString() || '',
                    languages: profile.languages?.join(', ') || '',
                    cuisines: profile.cuisines?.join(', ') || ''
                  });
                }
                setUpdateMessage({ type: '', text: '' });
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