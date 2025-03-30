import { useRef, useEffect } from 'react';
import { Marker, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  position: [number, number] | null; // Changed to required or null
  radius?: number; // Keep for potential future use, but not used for rendering circle here
  showRadius?: boolean; // Keep for potential future use
}

// Icon creation function remains the same
const createUserLocationIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `
      <div style="background-color: rgba(255, 0, 0, 0.6); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.3)"></div>
      <div style="background-color: rgba(255, 0, 0, 0.3); width: 36px; height: 36px; border-radius: 50%; position: absolute; top: -10px; left: -10px; animation: pulse 1.5s infinite;"></div>
    `,
    className: 'user-location-marker',
    iconSize: [36, 36],
    iconAnchor: [8, 8],
  });
};

/**
 * Simplified component to display the user's location marker.
 * Relies on the position prop provided by the parent component (WorldMap).
 */
const UserLocationMarker = ({ position, radius, showRadius }: UserLocationMarkerProps) => {
  const styleElRef = useRef<HTMLStyleElement | null>(null);

  // Effect to add/remove pulse animation CSS
  useEffect(() => {
    // Add CSS for Pulse effect only if it doesn't exist
    if (!document.getElementById('user-location-pulse-style')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'user-location-pulse-style'; // Give it an ID to prevent duplicates
      styleEl.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `;
      document.head.appendChild(styleEl);
      styleElRef.current = styleEl;
    }

    // Cleanup function to remove the style when the component unmounts
    // or if the position becomes null (though parent usually handles unmounting)
    return () => {
      const existingStyle = document.getElementById('user-location-pulse-style');
      if (existingStyle && existingStyle.parentNode) {
         // Check if other instances might need it before removing?
         // For simplicity now, we remove it. Consider a counter if multiple markers exist.
         // existingStyle.parentNode.removeChild(existingStyle);
      }
      // If we keep the style, clear the ref
      styleElRef.current = null;
    };
  }, []); // Run only once on mount

  // If no position is provided (e.g., permission denied, loading), render nothing
  if (!position) {
    return null;
  }

  // Render the marker using the provided position
  return (
    <Marker
      position={position}
      icon={createUserLocationIcon()}
      // Prevent keyboard interaction for this purely visual marker
      keyboard={false}
    >
      <Tooltip permanent={false} direction="top" offset={[0, -10]}>
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
