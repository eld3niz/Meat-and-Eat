import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression, LatLng } from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix default icon issue with webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationSearchMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  mapHeight?: string; // e.g., '300px'
}

// Component to handle map events like click and search results
const MapEventsHandler: React.FC<{
  setSelectedPosition: (pos: LatLng) => void;
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ setSelectedPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      setSelectedPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom()); // Center map on click
    },
  });

  useEffect(() => {
    // Add Geosearch control
    const provider = new OpenStreetMapProvider();
    const searchControl = GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false, // We handle the marker ourselves
      showPopup: false,
      autoClose: true,
      keepResult: true,
      searchLabel: 'Enter address or place name',
    });

    map.addControl(searchControl);

    // Handle search result selection
    const onResultSelect = (result: any) => { // Type 'any' due to leaflet-geosearch types
      const latLng = new LatLng(result.location.y, result.location.x);
      setSelectedPosition(latLng);
      onLocationSelect(latLng.lat, latLng.lng);
      map.flyTo(latLng, 13); // Zoom closer on search result
    };

    map.on('geosearch/showlocation', onResultSelect);

    // Cleanup function
    return () => {
      map.removeControl(searchControl);
      map.off('geosearch/showlocation', onResultSelect);
    };
  }, [map, setSelectedPosition, onLocationSelect]);

  return null; // This component doesn't render anything itself
};

const LocationSearchMap: React.FC<LocationSearchMapProps> = ({
  initialLat,
  initialLng,
  onLocationSelect,
  mapHeight = '300px',
}) => {
  const initialPosition: LatLngExpression = initialLat && initialLng ? [initialLat, initialLng] : [51.505, -0.09]; // Default to London if no initial pos
  const initialZoom = initialLat && initialLng ? 13 : 5; // Zoom in more if initial position is set

  const [selectedPosition, setSelectedPosition] = useState<LatLng | null>(
    initialLat && initialLng ? new LatLng(initialLat, initialLng) : null
  );

  // Update selectedPosition if initial props change (e.g., in edit mode after fetch)
  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedPosition(new LatLng(initialLat, initialLng));
    } else {
      setSelectedPosition(null); // Clear if initial props are cleared
    }
  }, [initialLat, initialLng]);

  return (
    <MapContainer
      center={initialPosition}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height: mapHeight, width: '100%', borderRadius: '8px', zIndex: 0 }} // Ensure zIndex is lower than modals if needed
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventsHandler
        setSelectedPosition={setSelectedPosition}
        onLocationSelect={onLocationSelect}
      />
      {selectedPosition && (
        <Marker position={selectedPosition}></Marker>
      )}
    </MapContainer>
  );
};

export default LocationSearchMap;