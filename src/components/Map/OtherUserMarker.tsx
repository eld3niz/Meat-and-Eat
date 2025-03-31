import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { otherUserIcon } from './OtherUserIcon'; // Import the custom green icon

interface OtherUserMarkerProps {
  latitude: number;
  longitude: number;
  userId?: string; // Optional: If needed for popups later
}

const OtherUserMarker: React.FC<OtherUserMarkerProps> = ({ latitude, longitude, userId }) => {
  // Basic validation: Don't render if coordinates are missing or invalid
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    console.warn("Invalid coordinates for OtherUserMarker:", { latitude, longitude, userId });
    return null;
  }

  return (
    <Marker position={[latitude, longitude]} icon={otherUserIcon}>
      {/* Optional: Basic Popup - Uncomment and customize if needed */}
      {/*
      <Popup>
        User: {userId || 'Unknown'} <br />
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
      </Popup>
      */}
    </Marker>
  );
};

export default React.memo(OtherUserMarker); // Memoize for performance if props don't change often