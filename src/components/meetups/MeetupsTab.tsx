import React, { useState } from 'react';
import AddMeetupButton from './AddMeetupButton';
import MeetupList from './MeetupList';
import MeetupFormPopup from './MeetupFormPopup';

// Placeholder data - replace with actual data fetching later
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Simulate fetching meetups - replace with actual API call
  const [meetups, setMeetups] = useState(placeholderMeetups);

  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  // Simulate adding a meetup - replace with actual API call and state update
  const handleAddMeetup = (newMeetupData: any) => {
    console.log("Simulating adding meetup:", newMeetupData);
    // In a real scenario, you'd post to Supabase and then refetch or update state
    const newMeetup = {
        ...newMeetupData,
        id: `temp-${Date.now()}`, // Temporary ID
        creator_id: 'current-user-uuid', // Replace with actual user ID
        created_at: new Date().toISOString(),
        profiles: { name: 'You', avatar_url: 'https://via.placeholder.com/40?text=U' } // Placeholder for current user
    };
    setMeetups(prev => [newMeetup, ...prev]);
    handleCloseForm();
  };

  return (
    <div className="p-4">
      <AddMeetupButton onAddClick={handleOpenForm} />
      <MeetupList meetups={meetups} />
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