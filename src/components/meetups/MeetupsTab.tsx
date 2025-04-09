import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import useAuth for user info
import supabase from '../../utils/supabaseClient'; // Import Supabase client directly
import AddMeetupButton from './AddMeetupButton';
import MeetupList from './MeetupList';
import MeetupFormPopup from './MeetupFormPopup';
import { Meetup } from '@/types/meetup'; // Use path alias based on tsconfig.json

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meetups, setMeetups] = useState<Meetup[]>([]); // Initialize with empty array and type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          profiles (
            name,
            avatar_url
          )
        `)
        .order('meetup_time', { ascending: true }); // Order by upcoming time

      if (fetchError) {
        throw fetchError;
      }

      // Filter out past meetups
      const now = new Date();
      const futureMeetups = (data as Meetup[] || []).filter(meetup => {
        // Ensure meetup_time is valid before comparing
        try {
          return new Date(meetup.meetup_time) > now;
        } catch (e) {
          console.error("Invalid date format for meetup:", meetup);
          return false; // Exclude meetups with invalid dates
        }
      });

      setMeetups(futureMeetups);

    } catch (err: any) {
      console.error("Error fetching meetups:", err);
      setError(err.message || 'Failed to fetch meetups.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch meetups on component mount
  useEffect(() => {
    fetchMeetups();
  }, []); // Fetch only once on mount (supabase client instance shouldn't change)

  // Handle adding a meetup via the form popup
  const handleAddMeetup = async (newMeetupData: Omit<Meetup, 'id' | 'created_at' | 'updated_at' | 'creator_id' | 'profiles'>) => {
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
    <div className="p-4 flex flex-col items-center"> {/* Added flex, flex-col, items-center */}
      {user && <AddMeetupButton onAddClick={handleOpenForm} />} {/* Only show add button if logged in */}
      {isLoading && <p>Loading meetups...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && (
        <div className="w-full max-w-4xl"> {/* Optional: Constrain width of the table container */}
          <MeetupList
            meetups={meetups}
            currentUserId={user?.id} // Pass current user ID
            onDelete={handleDeleteMeetup} // Pass delete handler
          />
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