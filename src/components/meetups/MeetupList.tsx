import React from 'react';
import MeetupListItem from './MeetupListItem';

import { Meetup } from '@/types/meetup'; // Import shared type

interface MeetupListProps {
  meetups: Meetup[];
  currentUserId: string | null | undefined; // ID of the logged-in user
  onDelete: (meetupId: string) => Promise<void>; // Function to handle deletion
}

const MeetupList: React.FC<MeetupListProps> = ({ meetups, currentUserId, onDelete }) => {
  if (meetups.length === 0) {
    return <p className="text-gray-500">No meetups scheduled yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Creator</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Place</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Distance</th> {/* Added Distance Header */}
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Location</th>
            <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th> {/* Changed to Actions Header */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {meetups.map((meetup) => (
            <MeetupListItem
              key={meetup.id}
              meetup={meetup}
              isCreator={currentUserId === meetup.creator_id} // Check if current user is the creator
              onDelete={onDelete} // Pass the delete handler
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MeetupList;