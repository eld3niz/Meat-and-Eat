import React, { useState } from 'react';
import { MeetupProposal } from '../../types/meetup';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get current user

// Removed supabase import as it's handled by parent handlers

// Define the possible action handlers the component might receive
interface MeetupRequestRowProps {
  proposal: MeetupProposal;
  onViewProfile: (senderId: string) => void;
  onViewLocation: (location: { lat: number; lng: number; name?: string }) => void;
  distanceKm?: number;
  // Handlers for 'pending' status (recipient view)
  onInitialAccept?: (proposalId: string) => Promise<void>;
  onDecline?: (proposalId: string) => Promise<void>;
  // Handlers for 'awaiting_final_confirmation' status
  onFinalConfirm?: (proposalId: string, senderId: string, recipientId: string) => Promise<void>;
  onCancel?: (proposalId: string) => Promise<void>;
  // No action handlers needed for other statuses ('finalized', 'cancelled', 'expired', 'declined')
}

const MeetupRequestRow: React.FC<MeetupRequestRowProps> = ({
  proposal,
  onViewProfile,
  onViewLocation,
  distanceKm,
  // Destructure new optional handlers
  onInitialAccept,
  onDecline,
  onFinalConfirm,
  onCancel,
}) => {
  const { user } = useAuth(); // Get current user
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

  // Generic handler wrapper to manage loading state and errors
  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await action();
      // Parent component (Header) is responsible for refetching data
    } catch (error: any) {
      console.error(`Error performing action "${actionName}":`, error);
      setUpdateError(error.message || `Failed to ${actionName}.`);
      setTimeout(() => setUpdateError(null), 5000); // Clear error after 5 seconds
    } finally {
      setIsUpdating(false);
    }
  };

  // Specific click handlers calling the generic wrapper
  const handleAcceptClick = () => {
    if (onInitialAccept) {
      handleAction(() => onInitialAccept(proposal.id), 'accept');
    }
  };

  const handleDeclineClick = () => {
    if (onDecline) {
      handleAction(() => onDecline(proposal.id), 'decline');
    }
  };

  const handleConfirmClick = () => {
    if (onFinalConfirm) {
      handleAction(() => onFinalConfirm(proposal.id, proposal.sender_id, proposal.recipient_id), 'confirm');
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      handleAction(() => onCancel(proposal.id), 'cancel');
    }
  };

  // Format date and time
  const formattedDateTime = format(new Date(proposal.meetup_time), 'Pp'); // Use meetup_time

  // Determine if the current user has confirmed in the 'awaiting_final_confirmation' state
  // Corrected syntax and logic:
  const currentUserConfirmed = proposal.status === 'awaiting_final_confirmation' && user ?
    ((user.id === proposal.sender_id && proposal.sender_confirmed) ||
     (user.id === proposal.recipient_id && proposal.recipient_confirmed)) : false;

  // Determine if the proposal is in a final, non-actionable state
  const isFinalState = ['finalized', 'declined', 'cancelled', 'expired'].includes(proposal.status);
  const isExpired = proposal.status === 'expired';

  return (
      // Add slight opacity for expired items
      <div className={`flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ${isExpired ? 'opacity-70' : ''}`}>
        {/* Left Side: Sender Info & Place */}
        <div className="flex-1 min-w-0 mr-4">
          <button
            onClick={handleViewProfileClick}
            className="text-sm font-semibold text-blue-600 hover:underline truncate focus:outline-none disabled:text-gray-500 disabled:no-underline"
            // Access sender name from nested profiles object, provide fallback
            title={`View profile of ${proposal.profiles?.name || 'Unknown Sender'}`}
            disabled={isFinalState} // Disable profile view for final states? Maybe not needed.
          >
            {proposal.profiles?.name || 'Unknown Sender'}
          </button>
          <p className="text-xs text-gray-500 truncate mt-0.5" title={proposal.place_name}>
            Wants to meet at: {proposal.place_name}
            {/* Added check for distanceKm */}
            {typeof distanceKm === 'number' && (
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
          {/* Display Status Text for Final States */}
          {isFinalState && (
              <p className={`mt-1 text-xs font-medium ${
                  proposal.status === 'finalized' ? 'text-green-600' :
                  proposal.status === 'declined' ? 'text-red-600' :
                  proposal.status === 'cancelled' ? 'text-yellow-700' :
                  'text-gray-500' // expired
              }`}>
                  Status: {proposal.status.replace(/_/g, ' ')} {/* Replace underscores */}
              </p>
          )}
          {/* Display Confirmation Status */}
          {proposal.status === 'awaiting_final_confirmation' && (
              <p className="mt-1 text-xs text-blue-600">
                  {currentUserConfirmed ? "Waiting for other party to confirm..." : "Awaiting your final confirmation."}
              </p>
          )}
          {/* Display Update Error */}
          {updateError && (
             <p className="mt-1 text-xs text-red-600">{updateError}</p>
          )}
        </div>

        {/* Right Side: Actions - Conditionally Rendered */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Always show Where? button unless finalized/cancelled/declined */}
          {!isFinalState || isExpired ? (
            <button
              onClick={handleViewLocationClick}
              className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Show location on map"
              disabled={isExpired && !isUpdating} // Keep enabled during update for visual consistency
            >
              Where?
            </button>
          ) : null}

          {/* --- Actions for 'pending' status --- */}
          {proposal.status === 'pending' && onInitialAccept && onDecline && (
            <>
              <button
                onClick={handleAcceptClick}
                disabled={isUpdating}
                className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"
              >
                {isUpdating ? '...' : 'Accept'}
              </button>
              <button
                onClick={handleDeclineClick}
                disabled={isUpdating}
                className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"
              >
                {isUpdating ? '...' : 'Decline'}
              </button>
            </>
          )}

          {/* --- Actions for 'awaiting_final_confirmation' status --- */}
          {proposal.status === 'awaiting_final_confirmation' && onFinalConfirm && onCancel && (
            <>
              <button
                onClick={handleConfirmClick}
                disabled={isUpdating || currentUserConfirmed} // Disable if updating or user already confirmed
                className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait disabled:bg-green-300"
                title={currentUserConfirmed ? "You have already confirmed" : "Confirm this meetup"}
              >
                {isUpdating ? '...' : (currentUserConfirmed ? 'Confirmed ✓' : 'Confirm Meetup')}
              </button>
              <button
                onClick={handleCancelClick}
                disabled={isUpdating}
                className="px-2.5 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-wait"
              >
                {isUpdating ? '...' : 'Cancel'}
              </button>
            </>
          )}

          {/* --- Counter Button (Always Disabled for now) --- */}
          {/* Show counter only for actionable states? Or always? Let's show for pending/awaiting */}
          {(proposal.status === 'pending' || proposal.status === 'awaiting_final_confirmation' || isExpired) && (
             <button
               disabled // Always disabled for now
               className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Counter
             </button>
          )}
        </div>
    </div>
  );
};

export default MeetupRequestRow;