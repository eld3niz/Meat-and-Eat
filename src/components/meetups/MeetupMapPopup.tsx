import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure Leaflet icons are set up (can be redundant if done globally, but safe)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface MeetupMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  placeName: string;
}

// Simple component to ensure map re-centers if props change while open
const CenterMapView = ({ center }: { center: LatLngExpression }) => {
    const map = useMap();
    map.setView(center, map.getZoom()); // Use existing zoom level
    return null;
};

const MeetupMapPopup: React.FC<MeetupMapPopupProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  placeName,
}) => {
  if (!isOpen) return null;

  const position: LatLngExpression = [latitude, longitude];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[1000] p-4"> {/* Ensure high z-index */}
      <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold z-10"
          aria-label="Close map"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-3 text-center">{placeName}</h3>
        <div className="h-64 w-full"> {/* Map container */}
          <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>{placeName}</Popup>
            </Marker>
            <CenterMapView center={position} />
          </MapContainer>
        </div>
        <div className="mt-4 text-center">
             <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default MeetupMapPopup;