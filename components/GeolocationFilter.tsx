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
  const [radius, setRadius] = useState<number>(50); // Default radius in km

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    // Immediately request location
    requestLocationAccess();

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

  const requestLocationAccess = () => {
    setPermissionStatus('requesting');
    getCurrentPosition();
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    onRadiusChange(newRadius);
  };

  return (
    <div className="absolute bottom-5 left-5 z-10 p-4 bg-white rounded-lg shadow-md max-w-xs opacity-90 hover:opacity-100 transition-opacity">
      <h3 className="text-lg font-semibold mb-2">Filter Locations</h3>
      
      {permissionStatus === 'initial' || permissionStatus === 'prompt' ? (
        <div className="text-center">
          <p className="mb-2">Please allow location access to use this app</p>
          <button 
            onClick={requestLocationAccess}
            className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Allow Location Access
          </button>
        </div>
      ) : permissionStatus === 'denied' ? (
        <div className="mb-4 text-red-500">
          <p>Location access is required for this app.</p>
          <p className="text-sm">Please enable location services in your browser settings and refresh.</p>
        </div>
      ) : permissionStatus === 'unsupported' ? (
        <div className="mb-4 text-red-500">
          Geolocation is not supported by your browser.
        </div>
      ) : permissionStatus === 'error' ? (
        <div className="mb-4 text-red-500">
          Error accessing your location. Please refresh and try again.
        </div>
      ) : null}

      {permissionStatus === 'granted' && (
        <div className="mt-2">
          <label className="block">
            <div className="flex justify-between mb-1">
              <span>Search radius:</span>
              <span className="font-medium">{radius} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={radius}
              onChange={handleRadiusChange}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 km</span>
              <span>500 km</span>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default GeolocationFilter;
