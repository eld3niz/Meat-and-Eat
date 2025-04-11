import React, { useState } from 'react'; // Import useState
import { MeetupProposal } from '../../types/meetup';
import { format } from 'date-fns'; // Using date-fns for formatting
import supabase from '../../utils/supabaseClient'; // Import Supabase client

interface MeetupRequestRowProps {
  proposal: MeetupProposal;
  onViewProfile: (senderId: string) => void;
  onViewLocation: (location: { lat: number; lng: number; name?: string }) => void;
  distanceKm?: number; // Optional distance from user's location
  onUpdateProposalStatus: (proposalId: string, newStatus: 'accepted' | 'declined') => Promise<void>; // Handler from parent
}

const MeetupRequestRow: React.FC<MeetupRequestRowProps> = ({
  proposal,
  onViewProfile,
  onViewLocation,
  distanceKm, // Destructure the new prop
  onUpdateProposalStatus, // Destructure the new handler
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleViewProfileClick = () => {
    onViewProfile(proposal.sender_id); // Use sender_id
  };

  const handleViewLocationClick = () => {
    onViewLocation({
      lat: proposal.latitude,
      lng: proposal.longitude,
      name: proposal.place_name, // Use place_name
    });
  };

  const handleStatusUpdate = async (newStatus: 'accepted' | 'declined') => {
      if (isUpdating) return; // Prevent double clicks

      setIsUpdating(true);
      setUpdateError(null);
      try {
          await onUpdateProposalStatus(proposal.id, newStatus);
          // No need to update local state here, parent (Header) will refetch
      } catch (error: any) {
          console.error(`Error updating proposal status to ${newStatus}:`, error);
          setUpdateError(`Failed to ${newStatus === 'accepted' ? 'accept' : 'decline'}.`);
          // Clear error after a few seconds
          setTimeout(() => setUpdateError(null), 4000);
      } finally {
          setIsUpdating(false);
      }
  };

  // Format date and time
  const formattedDateTime = format(new Date(proposal.meetup_time), 'Pp'); // Use meetup_time

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
      {/* Left Side: Sender Info & Place */}
      <div className="flex-1 min-w-0 mr-4">
        <button
          onClick={handleViewProfileClick}
          className="text-sm font-semibold text-blue-600 hover:underline truncate focus:outline-none"
          // Access sender name from nested profiles object, provide fallback
          title={`View profile of ${proposal.profiles?.name || 'Unknown Sender'}`}
        >
          {proposal.profiles?.name || 'Unknown Sender'}
        </button>
        <p className="text-xs text-gray-500 truncate mt-0.5" title={proposal.place_name}>
          Wants to meet at: {proposal.place_name}
          {distanceKm !== undefined && (
            <span className="ml-1 text-gray-400"> (~{distanceKm.toFixed(1)} km away)</span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          On: {formattedDateTime}
        </p>
        {proposal.description && (
           <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-300 pl-2">
             "{proposal.description}"
           </p>
        )}
        {/* Display Update Error */}
        {updateError && (
           <p className="mt-1 text-xs text-red-600">{updateError}</p>
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
          onClick={() => handleStatusUpdate('accepted')}
          disabled={isUpdating} // Disable while updating
          className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"
        >
          {isUpdating ? '...' : 'Accept'}
        </button>
        <button
          onClick={() => handleStatusUpdate('declined')}
          disabled={isUpdating} // Disable while updating
          className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"
        >
          {isUpdating ? '...' : 'Decline'}
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