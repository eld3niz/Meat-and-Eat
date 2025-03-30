import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import Button from './Button'; // Assuming a reusable Button component exists

const LocationPermissionModal: React.FC = () => {
  const { requestLocationPermission, locationPermissionStatus } = useAuth();

  const handleGrantClick = () => {
    requestLocationPermission();
  };

  let message = "To use the core features of this service, we need access to your browser's location.";
  if (locationPermissionStatus === 'denied') {
    message = "It looks like location access was denied. We need your location to show you relevant information and allow others to see you. Please grant permission to continue.";
  } else if (locationPermissionStatus === 'unavailable') {
    message = "We couldn't access your location. This might be because your browser doesn't support it, or there was an issue retrieving it. Please ensure location services are enabled on your device and try again.";
  }

  const additionalGuidance = "If you previously denied permission and don't see a prompt, please check your browser's site settings for this website and allow location access.";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Location Access Required</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        {locationPermissionStatus === 'denied' && (
           <p className="text-sm text-gray-500 mb-6">{additionalGuidance}</p>
        )}
        <div className="flex justify-end">
           {/* Assuming Button component takes onClick and children */}
           <Button onClick={handleGrantClick} className="bg-blue-500 hover:bg-blue-600 text-white">
             {locationPermissionStatus === 'denied' ? 'Retry Granting Access' : 'Check Location Access'}
           </Button>
           {/* Optionally add a cancel/dismiss button if there are parts of the site usable without location */}
           {/* <Button onClick={handleDismiss} variant="secondary" className="ml-2">Dismiss</Button> */}
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;