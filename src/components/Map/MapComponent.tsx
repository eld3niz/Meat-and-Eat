// Import React core components
import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Marker, Tooltip, MapContainer, TileLayer, Popup } from 'react-leaflet';
import L from 'leaflet';

// This function likely filters markers based on radius
const filterMarkersByRadius = (markers, userLocation, radius) => {
  if (!userLocation) return markers;
  return markers.filter(marker => {
    const distance = Math.sqrt(
      Math.pow(marker.latitude - userLocation.latitude, 2) +
      Math.pow(marker.longitude - userLocation.longitude, 2)
    );
    return distance <= radius;
  });
};

const MapComponent = ({ allMarkers, selectedRadius, ...props }) => {
  // Existing state variables
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [watchId, setWatchId] = useState(null);
  
  // Add state for user locations from Supabase
  const [userLocations, setUserLocations] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const { user } = useAuth(); // Get current logged-in user
  
  // Fetch user locations from Supabase
  useEffect(() => {
    const fetchUserLocations = async () => {
      setFetchError(null);
      try {
        // Fetch locations from all users
        const { data, error } = await supabase
          .from('user_locations')
          .select('user_id, latitude, longitude');

        if (error) {
          throw error;
        }

        if (data) {
          // Filter out the current user's own location if desired
          const otherUsersLocations = user 
            ? data.filter(loc => loc.user_id !== user.id) 
            : data;
          setUserLocations(otherUsersLocations);
          console.log('Fetched user locations:', otherUsersLocations);
        }
      } catch (error) {
        console.error('Error fetching user locations:', error.message);
        setFetchError('Could not fetch user locations.');
        setUserLocations([]); // Clear locations on error
      }
    };

    fetchUserLocations();

    // Set up real-time subscription for changes
    const subscription = supabase
      .channel('table-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_locations' }, 
        () => fetchUserLocations()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]); // Dependency array includes 'user'

  // Filter markers based on user location and selected radius
  const filteredMarkers = filterMarkersByRadius(allMarkers, userLocation, selectedRadius);

  // Render user location markers from Supabase
  const renderUserLocationMarkers = () => {
    return userLocations.map(location => (
      <Marker
        key={location.user_id}
        position={[location.latitude, location.longitude]}
        icon={L.divIcon({
          html: `
            <div style="background-color: rgba(255, 165, 0, 0.6); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>
          `,
          className: 'other-user-location-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })}
      >
        <Tooltip>
          <div>
            <strong>Another User</strong>
          </div>
        </Tooltip>
      </Marker>
    ));
  };

  // Function to store current user's location in Supabase
  const storeUserLocation = async (position) => {
    if (!user) return; // Don't proceed if not logged in
    
    try {
      // Check if user already has a location entry
      const { data } = await supabase
        .from('user_locations')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        // Update existing location
        await supabase
          .from('user_locations')
          .update({
            latitude: position.latitude,
            longitude: position.longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        // Insert new location
        await supabase
          .from('user_locations')
          .insert({
            user_id: user.id,
            latitude: position.latitude,
            longitude: position.longitude
          });
      }
      console.log('User location stored successfully');
    } catch (error) {
      console.error('Error storing user location:', error);
    }
  };

  // Modify the location tracking function to store user location in Supabase
  const handleLocationToggle = useCallback(() => {
    if (!isLocationEnabled) {
      // Turn on location tracking
      if (navigator.geolocation) {
        setIsLocationEnabled(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setUserLocation(newLocation);
            
            // Store user location in Supabase if user is logged in
            if (user) {
              storeUserLocation(newLocation);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLocationEnabled(false);
          }
        );
        
        // Set up continuous location tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const updatedLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setUserLocation(updatedLocation);
            
            // Update user location in Supabase
            if (user) {
              storeUserLocation(updatedLocation);
            }
          },
          (error) => {
            console.error("Error tracking location:", error);
          }
        );
        
        // Store watchId for cleanup
        setWatchId(watchId);
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    } else {
      // Turn off location tracking
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsLocationEnabled(false);
    }
  }, [isLocationEnabled, watchId, user]);

  return (
    <div className="map-container">
      {/* Map and existing controls */}
      <div className="map-wrapper">
        <MapContainer center={[0, 0]} zoom={3} style={{ height: '100%', width: '100%' }}>
          {/* Base map tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Render city markers */}
          {filteredMarkers.map((marker) => (
            <Marker 
              key={marker.id} 
              position={[marker.latitude, marker.longitude]}
              // Other marker props
            >
              <Popup>
                {/* Marker popup content */}
                {marker.name}
              </Popup>
            </Marker>
          ))}
          
          {/* Render current user location if enabled */}
          {isLocationEnabled && userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                html: `<div style="background-color: rgba(0, 123, 255, 0.6); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
                className: 'current-user-location-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Tooltip>Your Location</Tooltip>
            </Marker>
          )}
          
          {/* Render other user location markers */}
          {userLocations.length > 0 && renderUserLocationMarkers()}
          
          {/* Display error if location fetching failed */}
          {fetchError && (
            <div className="location-error-message">
              <p>{fetchError}</p>
            </div>
          )}
          
          {/* Map controls and UI elements */}
          <div className="location-controls">
            <button 
              onClick={handleLocationToggle}
              className={`location-toggle-btn ${isLocationEnabled ? 'active' : ''}`}
            >
              {isLocationEnabled ? 'Disable Location' : 'Enable Location'}
            </button>
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;