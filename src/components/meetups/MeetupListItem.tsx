import React, { useState } from 'react';
import MeetupMapPopup from './MeetupMapPopup';
// Modal and ReadOnlyUserProfile are no longer needed here
import UserProfilePopup from '../Profile/UserProfilePopup'; // Import the new popup component
import { Meetup } from '@/types/meetup'; // Import shared type

interface MeetupListItemProps {
    meetup: Meetup;
    isCreator: boolean; // Flag indicating if the current user is the creator
    onDelete: (meetupId: string) => Promise<void>; // Delete handler function
}

const MeetupListItem: React.FC<MeetupListItemProps> = ({ meetup, isCreator, onDelete }) => {
    const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false); // State for the new profile popup

    const handleOpenMapPopup = () => setIsMapPopupOpen(true);
    const handleCloseMapPopup = () => setIsMapPopupOpen(false);

    const handleOpenProfilePopup = () => setIsProfilePopupOpen(true);
    const handleCloseProfilePopup = () => setIsProfilePopupOpen(false);

    const formattedDate = new Date(meetup.meetup_time).toLocaleDateString(); // Use meetup_time
    const formattedTime = new Date(meetup.meetup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Use meetup_time
    const creatorName = meetup.profiles?.name ?? 'Unknown User'; // Fallback for name
    const avatarSrc = meetup.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=random&size=32`; // Use fallback name if profile is null

    return (
        <>
            <tr className="hover:bg-gray-50">
                {/* Creator Column */}
                <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                        <img
                            src={avatarSrc}
                            alt={`${creatorName}'s avatar`} // Use fallback name
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=random&size=32`; }} // Use fallback name
                        />
                        <button
                            onClick={handleOpenProfilePopup} // Use the new handler
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline focus:outline-none"
                            aria-label={`View profile of ${creatorName}`}
                            title={`View profile of ${creatorName}`}
                        >
                            {creatorName}
                        </button>
                    </div>
                </td>
                {/* Place Column */}
                {/* Use title from meetup data, provide fallback if needed */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{meetup.title || 'Untitled Meetup'}</td>
                {/* Date Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formattedDate}</td>
                {/* Time Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formattedTime}</td>
                {/* Location Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <button
                        onClick={handleOpenMapPopup}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                        Where?
                    </button>
                </td>
                {/* Actions Column (now just contains the button if creator) */}
                <td className="px-1 py-2 whitespace-nowrap text-center align-middle"> {/* Center the button */}
                    {isCreator ? (
                        <button
                            onClick={() => onDelete(meetup.id)}
                            className="p-1 h-6 w-6 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 rounded-full text-xs font-bold transition-colors duration-150"
                            aria-label={`Delete meetup: ${meetup.title || 'Untitled Meetup'}`}
                            title="Delete Meetup"
                        >
                            &times; {/* Use HTML entity for 'X' */}
                        </button>
                    ) : (
                        <button
                            // onClick={() => { /* TODO: Implement accept functionality */ }} // Placeholder for future action
                            className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                            aria-label={`Accept meetup: ${meetup.title || 'Untitled Meetup'}`}
                            title="Accept Meetup" // Tooltip for clarity
                        >
                            Accept
                        </button>
                    )}
                </td>
            </tr>
            {/* Render the actual Map Popup */}
            {isMapPopupOpen && (
                <MeetupMapPopup
                    isOpen={isMapPopupOpen}
                    onClose={handleCloseMapPopup}
                    latitude={meetup.latitude}
                    longitude={meetup.longitude}
                    placeName={meetup.title || 'Meetup Location'} // Pass title as placeName, provide fallback
                />
            )}
            {/* Profile Popup */}
            {isProfilePopupOpen && meetup.creator_id && ( // Ensure creator_id exists
                <UserProfilePopup
                    userId={meetup.creator_id}
                    isOpen={isProfilePopupOpen}
                    onClose={handleCloseProfilePopup}
                />
            )}
        </>
    );
};

export default MeetupListItem;