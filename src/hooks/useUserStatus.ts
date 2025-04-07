import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import { calculateDistance } from '../utils/geolocation';

export type UserStatus = 'Local' | 'Traveller' | 'Other' | 'Unknown' | 'Loading';

const DISTANCE_THRESHOLD_KM = 100;

export function useUserStatus() {
  const { user } = useAuth(); // Get user from context
  const [status, setStatus] = useState<UserStatus>('Loading');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect 1: Get Home Location
  useEffect(() => {
    if (!user) {
      setStatus('Unknown'); // Not logged in
      setHomeLocation(null);
      return;
    }

    // Fetch profile directly to get home location
    const fetchHomeLocation = async () => {
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('home_latitude, home_longitude')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (data?.home_latitude && data?.home_longitude) {
          setHomeLocation({ lat: data.home_latitude, lon: data.home_longitude });
        } else {
          setHomeLocation(null); // Home location not set
        }
      } catch (err: any) {
        console.error('Error fetching home location:', err);
        setError('Could not fetch home location.');
        setHomeLocation(null);
      }
    }; // Correct placement for the end of fetchHomeLocation async function

    fetchHomeLocation();

  }, [user]); // Re-run only if user changes

  // Effect 2: Get Current Location (Browser Geolocation)
  useEffect(() => {
    if (!user) return; // Only run if logged in

    setStatus('Loading'); // Reset status while fetching current location
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setCurrentLocation(null);
      return;
    }

    const success = (position: GeolocationPosition) => {
      setCurrentLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setError(null); // Clear previous errors
    };

    const geoError = (err: GeolocationPositionError) => {
      console.warn(`Geolocation error (${err.code}): ${err.message}`);
      setError(`Failed to get current location: ${err.message}. Please ensure location services are enabled.`);
      setCurrentLocation(null);
    };

    const options = {
      enableHighAccuracy: false, // Lower accuracy is usually sufficient and faster/less battery
      timeout: 10000, // 10 seconds
      maximumAge: 60000, // Allow cached position up to 1 minute old
    };

    const watchId = navigator.geolocation.watchPosition(success, geoError, options);

    // Cleanup function to stop watching location when component unmounts or user logs out
    return () => navigator.geolocation.clearWatch(watchId);

  }, [user]); // Re-run only if user changes (login/logout)

  // Effect 3: Calculate Status based on locations
  useEffect(() => {
    if (!user) {
      setStatus('Unknown');
      return;
    }

    if (error && !currentLocation) { // If there was an error getting current location
        setStatus('Unknown');
        return;
    }

    if (homeLocation === null) {
      setStatus('Other'); // Home location not set
      return;
    }

    if (currentLocation && homeLocation) {
      try {
        const distance = calculateDistance(
          homeLocation.lat,
          homeLocation.lon,
          currentLocation.lat,
          currentLocation.lon
        );

        if (distance < DISTANCE_THRESHOLD_KM) {
          setStatus('Local');
        } else {
          setStatus('Traveller');
        }
      } catch (calcError) {
        console.error("Error calculating distance:", calcError);
        setError("Could not calculate distance.");
        setStatus('Unknown');
      }
    } else if (!error) {
      // If no error, but current location isn't available yet, keep loading
      setStatus('Loading');
    }

  }, [user, currentLocation, homeLocation, error]); // Recalculate when any dependency changes

  return { status, error, currentLocation, homeLocation };
} // Correct placement for the end of useUserStatus hook function