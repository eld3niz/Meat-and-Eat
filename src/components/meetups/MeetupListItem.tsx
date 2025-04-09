import React, { useState, useMemo } from 'react'; // Added useMemo
import MeetupMapPopup from './MeetupMapPopup';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { calculateHaversineDistance } from '../../utils/mapUtils'; // Import distance function

// Re-use the detailed Meetup type (consider moving to src/types later)
interface MeetupProfile {
    name: string;
    avatar_url: string | null;
    age?: number;
    gender?: string;
    languages?: string[];
    home_latitude?: number;
    home_longitude?: number;
}

interface Meetup {
    id: string;
    creator_id: string;
    place_name: string;
    latitude: number;
    longitude: number;
    meetup_datetime: string; // ISO string format
    description: string | null;
    created_at: string; // ISO string format
    profiles: MeetupProfile;
}

interface MeetupListItemProps {
    meetup: Meetup;
}

// Define props including the Meetup type

const MeetupListItem: React.FC<MeetupListItemProps> = ({ meetup }) => {
    const { profile: currentUserProfile } = useAuth(); // Get current user's profile
    const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

    const handleOpenMapPopup = () => setIsMapPopupOpen(true);
    const handleCloseMapPopup = () => setIsMapPopupOpen(false);

    const formattedDate = new Date(meetup.meetup_datetime).toLocaleDateString();
    const formattedTime = new Date(meetup.meetup_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatarSrc = meetup.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(meetup.profiles.name)}&background=random&size=32`; // Use ui-avatars as fallback

    // Calculate distance using useMemo for efficiency
    const distanceKm = useMemo(() => {
        if (
            currentUserProfile?.home_latitude &&
            currentUserProfile?.home_longitude &&
            meetup.latitude &&
            meetup.longitude
        ) {
            return calculateHaversineDistance(
                currentUserProfile.home_latitude,
                currentUserProfile.home_longitude,
                meetup.latitude,
                meetup.longitude
            );
        }
        return null; // Return null if data is missing
    }, [currentUserProfile, meetup.latitude, meetup.longitude]); // Dependencies

    return (
        <>
            <tr className="hover:bg-gray-50">
                {/* Creator Column */}
                <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                        <img
                            src={avatarSrc}
                            alt={`${meetup.profiles.name}'s avatar`}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(meetup.profiles.name)}&background=random&size=32`; }} // Fallback on error
                        />
                        <span className="text-sm font-medium text-gray-900">{meetup.profiles.name}</span>
                    </div>
                </td>
                {/* Place Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{meetup.place_name}</td>
                {/* Date Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formattedDate}</td>
                {/* Time Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formattedTime}</td>
                {/* Distance Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '-'}
                </td>
                {/* Location Column */}
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <button
                        onClick={handleOpenMapPopup}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                        Where?
                    </button>
                </td>
            </tr>
            {/* Render the actual Map Popup */}
            {isMapPopupOpen && (
                <MeetupMapPopup
                    isOpen={isMapPopupOpen}
                    onClose={handleCloseMapPopup}
                    latitude={meetup.latitude}
                    longitude={meetup.longitude}
                    placeName={meetup.place_name}
                />
            )}
        </>
    );
};

export default MeetupListItem;