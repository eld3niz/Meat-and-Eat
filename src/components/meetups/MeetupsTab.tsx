import React, { useState, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import AddMeetupButton from './AddMeetupButton';
import MeetupList from './MeetupList';
import MeetupFormPopup from './MeetupFormPopup';
import MeetupFilters, { MeetupFiltersType } from './MeetupFilters'; // Import Filters
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get user's home location
import { calculateHaversineDistance } from '../../utils/mapUtils'; // Import distance function

// Type definitions (consider moving to src/types/index.ts)
interface MeetupProfile {
    name: string;
    avatar_url: string | null;
    age?: number;
    gender?: string;
    languages?: string[];
    home_latitude?: number;
    home_longitude?: number;
}

interface Meetup { // Keep this definition consistent
    id: string;
    creator_id: string;
    place_name: string;
    latitude: number;
    longitude: number;
    meetup_datetime: string; // ISO string format
    description: string | null;
    created_at: string; // ISO string format
    profiles: MeetupProfile; // Use the detailed profile type
}


// Placeholder data - replace with actual data fetching later
const placeholderMeetups: Meetup[] = [
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
      avatar_url: 'https://via.placeholder.com/40?text=A', // Placeholder avatar
      age: 30,
      gender: 'female',
      languages: ['English', 'German'],
      home_latitude: 52.51,
      home_longitude: 13.40,
    }
  },
   {
    id: '2',
    creator_id: 'user-2-uuid',
    place_name: 'Distant Restaurant',
    latitude: 48.85, // Paris
    longitude: 2.35,  // Paris
    meetup_datetime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    description: 'Dinner meetup while traveling',
    created_at: new Date().toISOString(),
    profiles: {
      name: 'Bob',
      avatar_url: 'https://via.placeholder.com/40?text=B',
      age: 45,
      gender: 'male',
      languages: ['English', 'French'],
      home_latitude: 51.50, // London
      home_longitude: -0.12, // London
    }
  },
  {
    id: '3',
    creator_id: 'user-3-uuid',
    place_name: 'Local Park Meetup',
    latitude: 52.515,
    longitude: 13.408,
    meetup_datetime: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
    description: 'Casual get-together',
    created_at: new Date().toISOString(),
    profiles: {
      name: 'Charlie',
      avatar_url: 'https://via.placeholder.com/40?text=C',
      age: 22,
      gender: 'male',
      languages: ['German'],
      home_latitude: 52.51,
      home_longitude: 13.40,
    }
  },
];

const MeetupsTab: React.FC = () => {
  const { profile: currentUserProfile } = useAuth(); // Get current user profile for distance/travel status
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Raw meetups state (replace with actual API call result later)
  const [allMeetups, setAllMeetups] = useState<Meetup[]>(placeholderMeetups);
  const [activeFilters, setActiveFilters] = useState<MeetupFiltersType>({
     minAge: null, maxAge: null, gender: null, languages: [],
     travelStatus: null, maxDistance: null, dateRangeStart: null,
     dateRangeEnd: null, timeRangeStart: null, timeRangeEnd: null,
  });

  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  const handleFilterChange = useCallback((newFilters: MeetupFiltersType) => {
      setActiveFilters(newFilters);
  }, []);

  // Extract unique available languages from all meetups for the filter dropdown
  const availableLanguages = useMemo(() => {
      const languages = new Set<string>();
      allMeetups.forEach(meetup => {
          meetup.profiles.languages?.forEach(lang => languages.add(lang));
      });
      return Array.from(languages).sort();
  }, [allMeetups]);

  // Calculate travel status based on creator's home vs meetup location
  const getTravelStatus = (meetup: Meetup): 'home' | 'traveling' | 'unknown' => {
      if (meetup.profiles.home_latitude && meetup.profiles.home_longitude) {
          const distance = calculateHaversineDistance(
              meetup.profiles.home_latitude,
              meetup.profiles.home_longitude,
              meetup.latitude,
              meetup.longitude
          );
          // Define a threshold (e.g., 50km) to consider someone "at home" vs "traveling" for a meetup
          return distance < 50 ? 'home' : 'traveling';
      }
      return 'unknown';
  };


  // Apply filters client-side (replace with backend filtering later)
  const filteredMeetups = useMemo(() => {
    return allMeetups.filter(meetup => {
      const profile = meetup.profiles;
      const meetupDate = new Date(meetup.meetup_datetime);

      // Age Filter
      if (activeFilters.minAge !== null && (profile.age ?? 0) < activeFilters.minAge) return false;
      if (activeFilters.maxAge !== null && (profile.age ?? Infinity) > activeFilters.maxAge) return false;

      // Gender Filter
      if (activeFilters.gender !== null && profile.gender !== activeFilters.gender) return false;

      // Language Filter
      if (activeFilters.languages.length > 0) {
        const creatorLangs = profile.languages ?? [];
        if (!activeFilters.languages.every(lang => creatorLangs.includes(lang))) return false;
      }

      // Travel Status Filter
      if (activeFilters.travelStatus !== null) {
          const status = getTravelStatus(meetup);
          if (status !== activeFilters.travelStatus && status !== 'unknown') return false;
      }

      // Max Distance Filter
      if (activeFilters.maxDistance !== null && currentUserProfile?.home_latitude && currentUserProfile?.home_longitude) {
          const distance = calculateHaversineDistance(
              currentUserProfile.home_latitude, currentUserProfile.home_longitude,
              meetup.latitude, meetup.longitude
          );
          if (distance > activeFilters.maxDistance) return false;
      }

      // Date Range Filter
      if (activeFilters.dateRangeStart !== null && meetupDate < activeFilters.dateRangeStart) return false;
      if (activeFilters.dateRangeEnd !== null) {
          // Adjust end date to include the whole day
          const endDateEndOfDay = new Date(activeFilters.dateRangeEnd);
          endDateEndOfDay.setHours(23, 59, 59, 999);
          if (meetupDate > endDateEndOfDay) return false;
      }


      // Time Range Filter
      const meetupTime = `${String(meetupDate.getHours()).padStart(2, '0')}:${String(meetupDate.getMinutes()).padStart(2, '0')}`;
      if (activeFilters.timeRangeStart !== null && meetupTime < activeFilters.timeRangeStart) return false;
      if (activeFilters.timeRangeEnd !== null && meetupTime > activeFilters.timeRangeEnd) return false;


      return true; // Passed all filters
    });
  }, [allMeetups, activeFilters, currentUserProfile]); // Add currentUserProfile dependency

  // Simulate adding a meetup - replace with actual API call and state update
  const handleAddMeetup = (newMeetupData: any) => {
    console.log("Simulating adding meetup:", newMeetupData);
    // In a real scenario, you'd post to Supabase and then refetch or update state
    const newMeetup = {
        ...newMeetupData,
        id: `temp-${Date.now()}`, // Temporary ID
        creator_id: 'current-user-uuid', // Replace with actual user ID
        created_at: new Date().toISOString(),
        profiles: { // Use current user's profile data if available
            name: currentUserProfile?.name || 'You',
            avatar_url: currentUserProfile?.avatar_url || 'https://via.placeholder.com/40?text=U',
            age: currentUserProfile?.age,
            gender: currentUserProfile?.gender,
            languages: currentUserProfile?.languages,
            home_latitude: currentUserProfile?.home_latitude,
            home_longitude: currentUserProfile?.home_longitude,
        }
    };
    setAllMeetups(prev => [newMeetup as Meetup, ...prev]); // Add new meetup to the raw list
    handleCloseForm();
  };

  return (
    <div className="p-4 flex flex-col"> {/* Use flex column */}
      {/* Center the Add Button */}
      <div className="flex justify-center mb-6"> {/* Increased bottom margin */}
          {/* Pass filtered meetups to the list */}
      </div>

      {/* Filters Section */}
      <MeetupFilters
          availableLanguages={availableLanguages}
          onFilterChange={handleFilterChange}
      />

      {/* List Section */}
      <AddMeetupButton onAddClick={handleOpenForm} />
      <MeetupList meetups={filteredMeetups} />
      {isFormOpen && (
        <MeetupFormPopup
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleAddMeetup}
        />
      )}
    </div>
  );
};

export default MeetupsTab;