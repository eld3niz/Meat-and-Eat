import { useEffect } from 'react'; // Removed useRef
import { Marker, Tooltip } from 'react-leaflet'; // Removed Circle as it's not used here
import L from 'leaflet';
import { currentUserIconRed } from './OtherUserIcon'; // Import the red icon for the current user
interface UserLocationMarkerProps {
  position: [number, number] | null; // Changed to required or null
  radius?: number; // Keep for potential future use, but not used for rendering circle here
  showRadius?: boolean; // Keep for potential future use
  onClick?: () => void; // Add optional onClick handler prop
}

// Removed createUserLocationIcon function and associated CSS effect logic

/**
 * Simplified component to display the user's location marker.
 * Relies on the position prop provided by the parent component (WorldMap).
 * Now uses the same icon as OtherUserMarker.
 */
// Removed radius and showRadius from props as they are not used directly here
const UserLocationMarker = ({ position, onClick }: UserLocationMarkerProps) => {
  // Removed useEffect for pulse animation and styleElRef

  // If no position is provided (e.g., permission denied, loading), render nothing
  if (!position) {
    return null;
  }

  // Render the marker using the provided position
  return (
    <Marker
      position={position}
      icon={currentUserIconRed} // Use the red icon
      // Prevent keyboard interaction for this purely visual marker
      keyboard={false}
      // Add click handler if provided
      eventHandlers={{ click: onClick }}
    >
      <Tooltip permanent={false} direction="top" offset={[0, -41]}> {/* Adjusted offset based on otherUserIcon popupAnchor */}
        <div>
          <strong>Ihr Standort</strong>
          <p className="text-xs text-gray-600">Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}</p>
        </div>
      </Tooltip>
      {/* Note: The Circle rendering is handled by RadiusCircle in WorldMap */}
    </Marker>
  );
};

export default UserLocationMarker;
