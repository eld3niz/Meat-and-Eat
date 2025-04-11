import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue with Leaflet and bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface SimpleMapDisplayProps {
  latitude: number;
  longitude: number;
  placeName?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Helper component to set map view after it loads
const SetMapView = ({ center, zoom }: { center: LatLngExpression; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [map, center, zoom]);
    return null;
};


const SimpleMapDisplay: React.FC<SimpleMapDisplayProps> = ({
  latitude,
  longitude,
  placeName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const position: LatLngExpression = [latitude, longitude];
  const mapRoot = document.getElementById('popup-root');

  if (!mapRoot) {
    console.error("Error: #popup-root element not found in the DOM.");
    return null; // Don't render if the portal target doesn't exist
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[3000] flex items-center justify-center p-4" // Higher z-index than other popups
      onClick={onClose} // Close when clicking overlay
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the map container
      >
        {/* Header with Place Name and Close Button */}
        <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
           <h3 className="text-lg font-semibold text-gray-800">
             {placeName || `Location @ ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
           </h3>
           <button
             onClick={onClose}
             className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
             aria-label="Close map"
           >
             &times;
           </button>
        </div>

        {/* Map Container */}
        <div className="h-80 w-full"> {/* Fixed height for the map */}
          <MapContainer
            center={position}
            zoom={14} // Slightly more zoomed in
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <SetMapView center={position} zoom={14} /> {/* Ensure map centers correctly */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              {placeName && (
                <Popup>{placeName}</Popup>
              )}
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>,
    mapRoot // Target element for the portal
  );
};

export default SimpleMapDisplay;