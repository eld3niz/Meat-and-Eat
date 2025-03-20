import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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

  // Create red marker for user location
  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Sample locations - replace with your actual data source
  const allLocations: Location[] = [
    { id: '1', name: 'Location 1', position: [51.505, -0.09], description: 'Description for Location 1' },
    { id: '2', name: 'Location 2', position: [51.51, -0.1], description: 'Description for Location 2' },
    { id: '3', name: 'Location 3', position: [51.49, -0.08], description: 'Description for Location 3' },
    { id: '4', name: 'Far Location', position: [52.5, -1.9], description: 'This location is far away' },
    { id: '5', name: 'Very Far Location', position: [55.9, -3.2], description: 'This location is very far away' },
  ];

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50); // Default radius in km
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([51.505, -0.09]); // Default center of map
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Filter locations whenever user location or radius changes
  useEffect(() => {
    if (!userLocation) {
      setFilteredLocations([]);
      return;
    }

    const filtered = allLocations.filter((location) => {
      // If radius is 0, show no locations
      if (searchRadius === 0) return false;
      
      // Calculate distance between user location and this location
      const distanceInMeters = getDistance(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        { latitude: location.position[0], longitude: location.position[1] }
      );
      
      // Convert distance to km and compare with radius
      return distanceInMeters / 1000 <= searchRadius;
    });

    setFilteredLocations(filtered);
    setIsInitialLoad(false);
  }, [userLocation, searchRadius, allLocations]);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setDefaultCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  return (
    <div className="relative flex flex-col h-screen w-full">
      <div className="flex-grow w-full">
        {isInitialLoad && !userLocation && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-80 z-50 flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Location Access Required</h2>
              <p className="mb-4">
                This application requires access to your location to show nearby places.
                Please allow location access when prompted.
              </p>
            </div>
          </div>
        )}
        
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
          
          {/* User location marker with red icon */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={redIcon}
              >
                <Popup>
                  <div className="font-semibold">Your Location</div>
                </Popup>
              </Marker>
              
              {/* Add circle to show search radius */}
              {searchRadius > 0 && (
                <Circle 
                  center={[userLocation.lat, userLocation.lng]}
                  radius={searchRadius * 1000} // Convert km to meters
                  pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.05 }}
                />
              )}
            </>
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
      
      {/* GeolocationFilter positioned at bottom left corner */}
      <GeolocationFilter 
        onLocationChange={setUserLocation}
        onRadiusChange={setSearchRadius}
      />
    </div>
  );
};

export default Map;
