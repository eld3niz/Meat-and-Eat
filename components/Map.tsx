import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getDistance } from 'geolib';
import GeolocationFilter from './GeolocationFilter';

// Interface for location data
interface Location {
  id: string;
  name: string;
  position: [number, number]; // [latitude, longitude]
  description: string;
}

// Component to recenter map
function MapRecenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

const Map: React.FC = () => {
  // Fix Leaflet icon issues with Next.js
  useEffect(() => {
    // Fix the broken icon issue
    // See: https://github.com/Leaflet/Leaflet/issues/4968
    // @ts-ignore - _getIconUrl exists but TypeScript doesn't know about it
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  // Sample locations - replace with your actual data source
  const allLocations: Location[] = [
    // Your locations list
    // Example:
    { id: '1', name: 'Location 1', position: [51.505, -0.09], description: 'Description for Location 1' },
    { id: '2', name: 'Location 2', position: [51.51, -0.1], description: 'Description for Location 2' },
    // Add more locations as needed
  ];

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default radius in km
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(allLocations);
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([51.505, -0.09]); // Default center of map

  // Filter locations whenever user location or radius changes
  useEffect(() => {
    if (!userLocation) {
      setFilteredLocations(allLocations);
      return;
    }

    const filtered = allLocations.filter((location) => {
      // Calculate distance between user location and this location
      const distanceInMeters = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: location.position[0], longitude: location.position[1] }
      );
      
      // Convert distance to km and compare with radius
      return distanceInMeters / 1000 <= searchRadius;
    });

    setFilteredLocations(filtered);
  }, [userLocation, searchRadius, allLocations]);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setDefaultCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4">
        <GeolocationFilter 
          onLocationChange={setUserLocation}
          onRadiusChange={setSearchRadius}
        />
      </div>
      
      <div className="flex-grow">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapRecenter center={userLocation ? [userLocation.lat, userLocation.lng] : null} />
          
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={new L.Icon({
                iconUrl: '/user-location-marker.png', // Create this icon
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })}
            >
              <Popup>Your location</Popup>
            </Marker>
          )}
          
          {/* Filtered location markers */}
          {filteredLocations.map((location) => (
            <Marker key={location.id} position={location.position}>
              <Popup>
                <div>
                  <h3 className="font-bold">{location.name}</h3>
                  <p>{location.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
