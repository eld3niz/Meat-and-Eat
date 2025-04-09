import React, { useState, useEffect, useMemo, useRef } from 'react'; // Added useMemo, useRef
import { useAuth } from '../../context/AuthContext'; // Import useAuth for user info
import supabase from '../../utils/supabaseClient'; // Import Supabase client directly
import AddMeetupButton from './AddMeetupButton';
import MeetupList from './MeetupList';
import MeetupFormPopup from './MeetupFormPopup';
import { Meetup } from '@/types/meetup'; // Use path alias based on tsconfig.json
import { languageOptions as allLanguageOptions, cuisineOptions } from '../../data/options'; // Import the full list + cuisineOptions
import { useUserStatus } from '../../hooks/useUserStatus'; // Added for location
import { calculateDistance } from '../../utils/geolocation'; // Added for distance calculation
import TagInput from '../UI/TagInput'; // Import TagInput for cuisine filter
// Placeholder data removed
const placeholderMeetups = [
  {
    id: '1',
    creator_id: 'user-1-uuid',
    place_name: 'Example Cafe',
    latitude: 52.52,
    longitude: 13.405,
    meetup_datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    description: 'Coffee and chat',
    created_at: new Date().toISOString(),
    profiles: { // Joined data simulation
      name: 'Alice',
      avatar_url: 'https://via.placeholder.com/40?text=A' // Placeholder avatar
    }
  },
   {
    id: '2',
    creator_id: 'user-2-uuid',
    place_name: 'Local Restaurant',
    latitude: 52.51,
    longitude: 13.41,
    meetup_datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    description: 'Dinner meetup',
    created_at: new Date().toISOString(),
    profiles: {
      name: 'Bob',
      avatar_url: 'https://via.placeholder.com/40?text=B'
    }
  },
];

const MeetupsTab: React.FC = () => {
  const { user } = useAuth(); // Get user info from AuthContext
  const { currentLocation, error: locationError } = useUserStatus(); // Get current location
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meetups, setMeetups] = useState<Meetup[]>([]); // Initialize with empty array and type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Filter states
  const [minAgeFilter, setMinAgeFilter] = useState(''); // Changed from ageFilter
  const [maxAgeFilter, setMaxAgeFilter] = useState(''); // Added maxAgeFilter
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]); // Changed from languageFilter
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false); // State for multi-select dropdown
  const languageDropdownRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection
  const [selectedCuisinesFilter, setSelectedCuisinesFilter] = useState<string[]>([]); // State for cuisine filter
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  // const [minDistanceFilter, setMinDistanceFilter] = useState('0'); // Removed min distance state
  const [maxDistanceFilter, setMaxDistanceFilter] = useState('any'); // Max distance state, default 'any'
  const [visibleMeetupsCount, setVisibleMeetupsCount] = useState(5); // State for pagination


  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  // Function to fetch meetups
  const fetchMeetups = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch meetups and join with profiles to get creator info
      const { data, error: fetchError } = await supabase
        .from('meetups')
        .select(`
          *,
          cuisines,
          profiles (
            name,
            avatar_url,
            age,
            languages
          )
        `)
        .order('meetup_time', { ascending: true }); // Order by upcoming time

      if (fetchError) {
        throw fetchError;
      }

      // Safely process and type the fetched data
      if (!data || !Array.isArray(data)) {
        console.warn("Received invalid data from Supabase fetch.");
        setMeetups([]); // Set to empty if data is invalid
      } else {
        // Map the raw data to the Meetup type, providing defaults
        const transformedData: Meetup[] = data.map((item: any): Meetup => ({
          id: item.id || '',
          creator_id: item.creator_id || '',
          title: item.title || (item.place_name || 'Meetup'), // Use place_name as fallback title if needed
          description: item.description || null,
          latitude: item.latitude || 0,
          longitude: item.longitude || 0,
          meetup_time: item.meetup_time || '',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          cuisines: item.cuisines || [], // Default cuisines to empty array
          profiles: item.profiles ? { // Safely handle nested profile
            name: item.profiles.name || 'Unknown User',
            avatar_url: item.profiles.avatar_url || null,
            age: item.profiles.age, // Keep optional
            languages: item.profiles.languages || [] // Default languages to empty array
          } : null, // Set profile to null if it doesn't exist
          place_name: item.place_name // Keep optional place_name if it exists
        }));

        // Filter out past meetups from the transformed data
        const now = new Date();
        const futureMeetups = transformedData.filter(meetup => {
          try {
            // Ensure meetup_time is valid before comparing
            return new Date(meetup.meetup_time) > now;
          } catch (e) {
            console.error("Invalid date format for meetup:", meetup);
            return false; // Exclude meetups with invalid dates
          }
        });

        setMeetups(futureMeetups);
      }


    } catch (err: any) {
      console.error("Error fetching meetups:", err);
      setError(err.message || 'Failed to fetch meetups.');
      // Set meetups to empty array on error to avoid issues with filtering undefined data
      setMeetups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch meetups on component mount
  useEffect(() => {
    fetchMeetups();
  }, []); // Fetch only once on mount (supabase client instance shouldn't change)

  // --- Constants for Filters ---
  const AGE_OPTIONS = Array.from({ length: 82 }, (_, i) => (18 + i).toString()); // Ages 18 to 99
  // const LANGUAGE_OPTIONS = ['English', 'German', 'Spanish', 'French', 'Italian', 'Turkish', 'Other']; // Removed hardcoded list
  const LANGUAGE_OPTIONS = allLanguageOptions; // Use the imported full list

  // --- Click Outside Handler for Language Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // --- Filtered meetups logic ---
  const filteredMeetups = useMemo(() => {
    // Convert age filters to numbers, handle empty strings
    const minAge = minAgeFilter ? parseInt(minAgeFilter, 10) : null;
    const maxAge = maxAgeFilter ? parseInt(maxAgeFilter, 10) : null;

    return meetups.filter(meetup => {
      const meetupDate = new Date(meetup.meetup_time);
      const profileAge = meetup.profiles?.age;
      const profileLanguages = meetup.profiles?.languages || []; // Default to empty array
      const meetupCuisines = meetup.cuisines || []; // Get cuisines from the meetup itself
      const meetupLat = meetup.latitude;
      const meetupLon = meetup.longitude;

      // Age Range Filter
      if (profileAge !== undefined && profileAge !== null) {
        if (minAge !== null && profileAge < minAge) {
          return false; // Age is below minimum
        }
        if (maxAge !== null && profileAge > maxAge) {
          return false; // Age is above maximum
        }
      } else if (minAge !== null || maxAge !== null) {
        // If age filters are set but profile has no age, exclude it
        return false;
      }


      // Languages Filter (Meetup creator must have ALL selected languages)
      if (selectedLanguages.length > 0) {
          const profileLanguagesLower = profileLanguages.map(lang => lang.toLowerCase());
          const selectedLanguagesLower = selectedLanguages.map(lang => lang.toLowerCase());

          // Check if every selected language is present in the profile's languages
          const hasAllLanguages = selectedLanguagesLower.every(selLang =>
              profileLanguagesLower.includes(selLang)
          );

          if (!hasAllLanguages) {
              return false;
          }
      }

      // Cuisine Filter (Meetup must have ALL selected cuisines)
      if (selectedCuisinesFilter.length > 0) {
          const meetupCuisinesLower = meetupCuisines.map((c: string) => c.toLowerCase());
          const selectedCuisinesLower = selectedCuisinesFilter.map(c => c.toLowerCase());

          const hasAllCuisines = selectedCuisinesLower.every(selCuisine =>
              meetupCuisinesLower.includes(selCuisine)
          );

          if (!hasAllCuisines) {
              return false;
          }
      }

      // Date Filter
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        // Compare year, month, and day, ignoring time
        if (meetupDate.getFullYear() !== filterDate.getFullYear() ||
            meetupDate.getMonth() !== filterDate.getMonth() ||
            meetupDate.getDate() !== filterDate.getDate()) {
          return false;
        }
      }

      // Time Filter
      if (timeFilter) {
        const [filterHours, filterMinutes] = timeFilter.split(':').map(Number);
        // Compare hours and minutes
        if (meetupDate.getHours() !== filterHours || meetupDate.getMinutes() !== filterMinutes) {
          return false;
        }
      }

      // Distance Filter (Max Only)
      if (maxDistanceFilter !== 'any' && currentLocation && meetupLat && meetupLon) {
        const maxDistance = parseInt(maxDistanceFilter, 10);
        try {
          const distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lon,
            meetupLat,
            meetupLon
          );

          // Check if distance exceeds the selected maximum
          if (distance > maxDistance) {
            return false;
          }
        } catch (calcError) {
          console.error("Error calculating distance for filter:", calcError);
          return false; // Exclude if calculation fails
        }
      } else if (maxDistanceFilter !== 'any' && !currentLocation) {
         // If filtering by distance but location is unavailable, exclude the meetup
         return false;
      }

      return true; // Include meetup if all filters pass or are inactive
    });
  }, [meetups, minAgeFilter, maxAgeFilter, selectedLanguages, selectedCuisinesFilter, dateFilter, timeFilter, maxDistanceFilter, currentLocation]); // Added selectedCuisinesFilter dependency

  // --- Pagination Logic ---
  const meetupsToShow = useMemo(() => {
    return filteredMeetups.slice(0, visibleMeetupsCount);
  }, [filteredMeetups, visibleMeetupsCount]);

  const handleSeeMore = () => {
    setVisibleMeetupsCount(prevCount => prevCount + 5); // Increase count by 5
  };

  // Handle adding a meetup via the form popup
  // Update the type to expect 'cuisines' in the data from the form
  const handleAddMeetup = async (newMeetupData: Omit<Meetup, 'id' | 'created_at' | 'updated_at' | 'creator_id' | 'profiles'> & { cuisines?: string[] }) => {
    if (!supabase || !user) {
      setError("User not logged in or Supabase client not available.");
      return;
    }

    setIsLoading(true); // Indicate loading state during submission
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('meetups')
        .insert([
          {
            ...newMeetupData,
            creator_id: user.id, // Set the creator ID
            // created_at and updated_at will be set by default in DB
          },
        ])
        .select(); // Add select() to potentially get the inserted data back if needed, though we refetch anyway

      if (insertError) {
        throw insertError;
      }

      // Close the form and refresh the list
      handleCloseForm();
      await fetchMeetups(); // Refresh the meetups list

    } catch (err: any) {
      console.error("Error adding meetup:", err);
      setError(err.message || 'Failed to add meetup.');
      // Keep the form open in case of error? Let's close it for now.
      // If keeping open, don't call handleCloseForm() here in catch block.
      handleCloseForm();
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Handle deleting a meetup
  const handleDeleteMeetup = async (meetupId: string) => {
    if (!supabase || !user) {
      setError("User not logged in or Supabase client not available.");
      return;
    }

    // Confirmation dialog
    if (!window.confirm("Are you sure you want to delete this meetup? This action cannot be undone.")) {
      return; // Stop if user cancels
    }

    setIsLoading(true); // Indicate loading state during deletion
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('meetups')
        .delete()
        .match({ id: meetupId, creator_id: user.id }); // Ensure user can only delete their own

      if (deleteError) {
        // Handle potential RLS errors if user tries deleting others' meetups (though UI should prevent this)
        if (deleteError.code === '42501') { // RLS violation code might vary
             throw new Error("You do not have permission to delete this meetup.");
        }
        throw deleteError;
      }

      // Refresh the list after successful deletion
      await fetchMeetups();

    } catch (err: any) {
      console.error("Error deleting meetup:", err);
      setError(err.message || 'Failed to delete meetup.');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="p-4 flex flex-col items-center pb-20"> {/* Added bottom padding pb-20 */}
      {user && <AddMeetupButton onAddClick={handleOpenForm} />} {/* Only show add button if logged in */}

      {/* Filter Section */}
      <div className="my-4 p-4 border rounded shadow-sm bg-gray-50 w-full max-w-4xl"> {/* Filter section container */}
        <h3 className="text-lg font-semibold mb-3">Filter Meetups</h3>
        {/* Increased columns for new filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">

          {/* Age Filter (Min/Max Dropdowns) */}
          <div className="flex gap-2"> {/* Container for Min/Max Age */}
             {/* Min Age */}
             <div className="flex-1">
               <label htmlFor="minAgeFilter" className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
               <select
                 id="minAgeFilter"
                 value={minAgeFilter} // Use correct state variable
                 onChange={(e) => setMinAgeFilter(e.target.value)} // Use correct state setter
                 className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
               >
                 <option value="">Any</option>
                 {AGE_OPTIONS.map(age => (
                   <option key={`min-${age}`} value={age}>{age}</option>
                 ))}
               </select>
             </div>
             {/* Max Age */}
             <div className="flex-1">
               <label htmlFor="maxAgeFilter" className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
               <select
                 id="maxAgeFilter"
                 value={maxAgeFilter} // Use correct state variable
                 onChange={(e) => setMaxAgeFilter(e.target.value)} // Use correct state setter
                 className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
               >
                 <option value="">Any</option>
                 {AGE_OPTIONS.map(age => (
                   <option key={`max-${age}`} value={age}>{age}</option>
                 ))}
               </select>
             </div>
          </div>

          {/* Language Filter (Multi-select Dropdown) */}
          <div className="relative" ref={languageDropdownRef}> {/* Container with ref for click-outside */}
             <label htmlFor="languageFilterButton" className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
             <button
               id="languageFilterButton"
               type="button"
               onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)} // Toggle dropdown state
               className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white text-left focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex justify-between items-center"
             >
               <span className="truncate text-gray-700"> {/* Display selected languages or placeholder */}
                 {selectedLanguages.length === 0 ? 'Select Languages' : selectedLanguages.join(', ')}
               </span>
               {/* Dropdown arrow icon */}
               <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
             </button>
             {/* Dropdown Panel */}
             {isLanguageDropdownOpen && (
               <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                 {LANGUAGE_OPTIONS.map(lang => (
                   <label key={lang} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={selectedLanguages.includes(lang)} // Check if language is selected
                       onChange={(e) => { // Handle checkbox change
                         const checked = e.target.checked;
                         setSelectedLanguages(prev => // Update selected languages array
                           checked ? [...prev, lang] : prev.filter(l => l !== lang)
                         );
                       }}
                       className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                     />
                     <span className="text-sm text-gray-700">{lang}</span>
                   </label>
                 ))}
               </div>
             )}
           </div>

          {/* Cuisine Filter (TagInput) */}
          <div>
            <TagInput
              label="Cuisines"
              id="cuisine-filter"
              options={cuisineOptions}
              selectedItems={selectedCuisinesFilter}
              onChange={(newSelection) => setSelectedCuisinesFilter(newSelection)}
              placeholder="Filter by cuisines"
            />
          </div>

         {/* Date Filter */}
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
               className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
           />
          </div>
          {/* Time Filter */}
          <div>
            <label htmlFor="timeFilter" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              id="timeFilter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
    
          {/* Distance Filter (Max Only Dropdown) */}
          <div>
            <label htmlFor="maxDistanceFilter" className="block text-sm font-medium text-gray-700 mb-1">Max Dist (km)</label>
            <select
              id="maxDistanceFilter"
              value={maxDistanceFilter}
              onChange={(e) => setMaxDistanceFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              disabled={!!locationError}
              title={locationError ? `Distance filter disabled: ${locationError}` : 'Filter by maximum distance'}
            >
              <option value="any">Any</option>
              {/* Generate options from 0 to 50 */}
              {Array.from({ length: 51 }, (_, i) => i).map(dist => (
                <option key={`max-dist-${dist}`} value={dist}>{dist}</option>
              ))}
            </select>
            {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
          </div>
        </div>
      </div>

      {/* Meetup List Section */}
      {isLoading && <p>Loading meetups...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && (
         <div className="w-full max-w-4xl"> {/* Container for list and button */}
           {filteredMeetups.length === 0 ? (
              <p>No meetups match the current filters.</p> // Message when filters result in no meetups
           ) : (
             <>
               <MeetupList
                 meetups={meetupsToShow} // Pass only the visible slice
                 currentUserId={user?.id}
                 onDelete={handleDeleteMeetup}
               />
               {/* "See More" Button */}
               {visibleMeetupsCount < filteredMeetups.length && (
                 <div className="mt-6 text-center"> {/* Add margin top and center align */}
                   <button
                     onClick={handleSeeMore}
                     className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                   >
                     See More
                   </button>
                 </div>
               )}
             </>
           )}
         </div>
       )}
      {isFormOpen && user && ( // Only render form if open and user is logged in
        <MeetupFormPopup
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleAddMeetup} // We'll update this function next
          // Pass fetchMeetups to refresh list after adding
          // onSuccess prop removed as onSubmit now handles refresh via fetchMeetups
        />
      )}
    </div>
  );
};

export default MeetupsTab;