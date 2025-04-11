import React from 'react';
import { MeetupProposal } from '../../types/meetup';
import { format } from 'date-fns'; // Using date-fns for formatting

interface MeetupRequestRowProps {
  proposal: MeetupProposal;
  onViewProfile: (senderId: string) => void;
  onViewLocation: (location: { lat: number; lng: number; name?: string }) => void;
}

const MeetupRequestRow: React.FC<MeetupRequestRowProps> = ({
  proposal,
  onViewProfile,
  onViewLocation,
}) => {
  const handleViewProfileClick = () => {
    onViewProfile(proposal.senderId);
  };

  const handleViewLocationClick = () => {
    onViewLocation({
      lat: proposal.latitude,
      lng: proposal.longitude,
      name: proposal.placeName,
    });
  };

  // Format date and time
  const formattedDateTime = format(new Date(proposal.meetupTime), 'PPpp'); // e.g., "Jul 21, 2024, 2:00 PM"

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
      {/* Left Side: Sender Info & Place */}
      <div className="flex-1 min-w-0 mr-4">
        <button
          onClick={handleViewProfileClick}
          className="text-sm font-semibold text-blue-600 hover:underline truncate focus:outline-none"
          title={`View profile of ${proposal.senderName}`}
        >
          {proposal.senderName}
        </button>
        <p className="text-xs text-gray-500 truncate mt-0.5" title={proposal.placeName}>
          Wants to meet at: {proposal.placeName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          On: {formattedDateTime}
        </p>
        {proposal.description && (
           <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">
             "{proposal.description}"
           </p>
        )}
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={handleViewLocationClick}
          className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
          title="Show location on map"
        >
          Where?
        </button>
        <button
          // onClick={() => {/* Accept logic later */}}
          disabled // Disabled for now
          className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Accept
        </button>
        <button
          // onClick={() => {/* Decline logic later */}}
          disabled // Disabled for now
          className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Decline
        </button>
        <button
          // onClick={() => {/* Counter logic later */}}
          disabled // Disabled for now
          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Counter
        </button>
      </div>
    </div>
  );
};

export default MeetupRequestRow;