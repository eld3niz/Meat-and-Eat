import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';

interface ProfileData {
  name: string;
  age: number | null;
  languages: string[];
  cuisines: string[];
  city: string | null;
}

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('name, age, languages, cuisines, city')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfileData(data);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
        <p className="text-center text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h2>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600">
          <p>Error loading profile: {error}</p>
        </div>
      ) : profileData ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{profileData.name}</p>
          </div>
          
          {profileData.age && (
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{profileData.age}</p>
            </div>
          )}
          
          {profileData.city && (
            <div>
              <p className="text-sm text-gray-500">City</p>
              <p className="font-medium">{profileData.city}</p>
            </div>
          )}
          
          {profileData.languages && profileData.languages.length > 0 && (
            <div>
              <p className="text-sm text-gray-500">Languages</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profileData.languages.map((language, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {profileData.cuisines && profileData.cuisines.length > 0 && (
            <div>
              <p className="text-sm text-gray-500">Favorite Cuisines</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profileData.cuisines.map((cuisine, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-600">No profile data found.</p>
      )}
      
      <div className="mt-6">
        <button
          onClick={signOut}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile;