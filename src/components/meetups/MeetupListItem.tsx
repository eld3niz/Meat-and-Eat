import React, { useState } from 'react';
import MeetupMapPopup from './MeetupMapPopup';

import { Meetup } from '@/types/meetup'; // Import shared type

interface MeetupListItemProps {
    meetup: Meetup;
    isCreator: boolean; // Flag indicating if the current user is the creator
    onDelete: (meetupId: string) => Promise<void>; // Delete handler function
}

const MeetupListItem: React.FC<MeetupListItemProps> = ({ meetup, isCreator, onDelete }) => {
    const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

    const handleOpenMapPopup = () => setIsMapPopupOpen(true);
    const handleCloseMapPopup = () => setIsMapPopupOpen(false);

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
                        <span className="text-sm font-medium text-gray-900">{creatorName}</span>
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
                    {isCreator && (
                        <button
                            onClick={() => onDelete(meetup.id)}
                            className="p-1 h-6 w-6 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 rounded-full text-xs font-bold transition-colors duration-150"
                            aria-label={`Delete meetup: ${meetup.title || 'Untitled Meetup'}`} // Use title here
                            title="Delete Meetup" // Tooltip for clarity
                        >
                            &times; {/* Use HTML entity for 'X' */}
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
        </>
    );
};

export default MeetupListItem;