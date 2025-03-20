import React, { useState, useEffect } from 'react';

interface GeolocationFilterProps {
  onLocationChange: (location: { lat: number; lng: number } | null) => void;
  onRadiusChange: (radius: number) => void;
}

const GeolocationFilter: React.FC<GeolocationFilterProps> = ({ 
  onLocationChange, 
  onRadiusChange 
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('initial');
  const [radius, setRadius] = useState<number>(5); // Default radius in km

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    // Check for previously granted permissions
    navigator.permissions?.query({ name: 'geolocation' })
      .then((result) => {
        setPermissionStatus(result.state);
        
        if (result.state === 'granted') {
          getCurrentPosition();
        }
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
          if (result.state === 'granted') {
            getCurrentPosition();
          } else if (result.state === 'denied') {
            onLocationChange(null);
          }
        });
      });
  }, []);

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationChange({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting location:', error);
        setPermissionStatus('error');
        onLocationChange(null);
      }
    );
  };

  const handleRequestPermission = () => {
    setPermissionStatus('requesting');
    getCurrentPosition();
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold mb-2">Location Filter</h3>
      
      {permissionStatus === 'initial' || permissionStatus === 'prompt' ? (
        <button 
          onClick={handleRequestPermission}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Allow Location Access
        </button>
      ) : permissionStatus === 'denied' ? (
        <div className="mb-4 text-red-500">
          Location access was denied. Please enable location services in your browser settings.
        </div>
      ) : permissionStatus === 'unsupported' ? (
        <div className="mb-4 text-red-500">
          Geolocation is not supported by your browser.
        </div>
      ) : permissionStatus === 'error' ? (
        <div className="mb-4 text-red-500">
          Error accessing your location.
        </div>
      ) : null}

      {permissionStatus === 'granted' && (
        <div className="mt-4">
          <label className="block mb-2">
            Search radius: {radius} km
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={handleRadiusChange}
              className="w-full mt-1"
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default GeolocationFilter;
