import React, { useEffect } from 'react';

interface LocationAccessModalProps {
  onPermissionChange: (status: string, location: { lat: number; lng: number } | null) => void;
  permissionStatus: string;
}

const LocationAccessModal: React.FC<LocationAccessModalProps> = ({ 
  onPermissionChange,
  permissionStatus
}) => {
  // Request location permission when component mounts
  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      onPermissionChange('unsupported', null);
      return;
    }

    // Check for previously granted permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            getCurrentPosition();
          } else {
            onPermissionChange(result.state, null);
          }
          
          result.addEventListener('change', () => {
            if (result.state === 'granted') {
              getCurrentPosition();
            } else {
              onPermissionChange(result.state, null);
            }
          });
        });
    }
  }, []);

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onPermissionChange('granted', { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting location:', error);
        onPermissionChange('error', null);
      }
    );
  };

  const handleRequestPermission = () => {
    onPermissionChange('requesting', null);
    getCurrentPosition();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Location Access Required</h2>
        
        <p className="mb-6 text-center">
          This application needs access to your location to show nearby places on the map.
        </p>
        
        {permissionStatus === 'initial' || permissionStatus === 'prompt' ? (
          <div className="text-center">
            <button 
              onClick={handleRequestPermission}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Allow Location Access
            </button>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="text-center text-red-600">
            <p className="mb-4">Location access was denied. You cannot use this application without providing location access.</p>
            <p className="mb-4">Please enable location services in your browser settings and refresh the page.</p>
            <button 
              onClick={handleRequestPermission}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : permissionStatus === 'unsupported' ? (
          <div className="text-center text-red-600">
            <p>Geolocation is not supported by your browser. Please use a different browser to access this application.</p>
          </div>
        ) : permissionStatus === 'error' ? (
          <div className="text-center text-red-600">
            <p className="mb-4">Error accessing your location. Please try again.</p>
            <button 
              onClick={handleRequestPermission}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationAccessModal;
