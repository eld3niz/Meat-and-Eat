import React from 'react';
import MeetupListItem from './MeetupListItem';

// Define a type for the meetup data based on MeetupsTab placeholder
// Ensure this matches the structure including the nested profile
interface Meetup {
  id: string;
  creator_id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  meetup_datetime: string; // ISO string format
  description: string | null;
  created_at: string; // ISO string format
  profiles: { // Simulating joined data
    name: string;
    avatar_url: string | null;
  };
}

interface MeetupListProps {
  meetups: Meetup[];
}

const MeetupList: React.FC<MeetupListProps> = ({ meetups }) => {
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
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {meetups.map((meetup) => (
            <MeetupListItem key={meetup.id} meetup={meetup} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MeetupList;