import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../utils/supabaseClient';
import MeetupList from './MeetupList';
import { Meetup } from '@/types/meetup';

const MyOffersTab: React.FC = () => {
  const { user } = useAuth();
  const [myMeetups, setMyMeetups] = useState<Meetup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user's meetups
  const fetchMyMeetups = async () => {
    if (!supabase || !user) {
      setIsLoading(false);
      // Don't set an error here, just means no user logged in
      setMyMeetups([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Fetch meetups created by the current user, join with profiles
      // Fetch meetups created by the current user, join with profiles
      // Corrected the .select() template literal syntax
      const { data: fetchedData, error: fetchError } = await supabase
        .from('meetups')
        .select(`
          *,
          profiles (
            name,
            avatar_url,
            age,
            languages
          )
        `)
        .eq('creator_id', user.id) // Filter by creator_id
        .order('meetup_time', { ascending: true }); // Order by upcoming time

      if (fetchError) {
        throw fetchError;
      }

      // Ensure profiles object exists even if null from DB join
      // Use fetchedData here
      const meetupsWithProfiles = (fetchedData as any[] || []).map(m => ({
        ...m,
        profiles: m.profiles || {}
      }));

      // Filter out past meetups (optional, but consistent with MeetupsTab)
      const now = new Date();
      const futureMeetups = meetupsWithProfiles.filter(meetup => {
        try {
          return new Date(meetup.meetup_time) > now;
        } catch (e) {
          console.error("Invalid date format for user meetup:", meetup);
          return false;
        }
      });


      setMyMeetups(futureMeetups as Meetup[]);

    } catch (err: any) {
      console.error("Error fetching user's meetups:", err);
      setError(err.message || 'Failed to fetch your meetups.');
      setMyMeetups([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch meetups on component mount or when user changes
  useEffect(() => {
    if (user) { // Only fetch if user is logged in
        fetchMyMeetups();
    } else {
        setMyMeetups([]); // Clear meetups if user logs out
        setIsLoading(false);
    }
  }, [user]); // Refetch if user changes

  // Handle deleting a meetup (copied and adapted from MeetupsTab)
  const handleDeleteMeetup = async (meetupId: string) => {
    if (!supabase || !user) {
      setError("User not logged in or Supabase client not available.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this meetup? This action cannot be undone.")) {
      return;
    }

    // Optimistic UI update: Remove immediately from state
    setMyMeetups(prev => prev.filter(m => m.id !== meetupId));
    setError(null); // Clear previous errors

    try {
      const { error: deleteError } = await supabase
        .from('meetups')
        .delete()
        .match({ id: meetupId, creator_id: user.id }); // Ensure user can only delete their own

      if (deleteError) {
        // Revert optimistic update on error
        fetchMyMeetups(); // Refetch to get the correct state back
        throw deleteError;
      }

      // No need to refetch on success, already removed optimistically

    } catch (err: any) {
      console.error("Error deleting meetup:", err);
      setError(err.message || 'Failed to delete meetup.');
      // Refetch to ensure UI consistency after error
      fetchMyMeetups();
    }
    // No finally block needed for loading state with optimistic update
  };

  if (!user) {
      return <p className="text-center text-gray-600 p-4">Please log in to see your offers.</p>;
  }

  return (
    <div className="p-1"> {/* Minimal padding */}
      {isLoading && <p className="text-center text-gray-600 py-4">Loading your offers...</p>}
      {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}
      {!isLoading && !error && (
        myMeetups.length > 0 ? (
          <MeetupList
            meetups={myMeetups}
            currentUserId={user.id} // User is guaranteed here
            onDelete={handleDeleteMeetup} // Pass delete handler
          />
        ) : (
          <p className="text-center text-gray-600 py-4">You haven't created any upcoming meetups yet.</p>
        )
      )}
    </div>
  );
};

export default MyOffersTab;