import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import supabase from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export type LocationPermissionStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  locationPermissionStatus: LocationPermissionStatus;
  userCoordinates: [number, number] | null;
  isFetchingLocation: boolean; // <-- Added state for location fetching status
  signOut: () => Promise<void>;
  requestLocationPermission: () => Promise<void>; // Still useful for manual trigger from modal
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<LocationPermissionStatus>('pending');
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false); // <-- State for location fetch

  // --- DB Update Function ---
  const updateUserLocationAndProfile = async (userId: string, latitude: number, longitude: number, accessGranted: boolean) => {
    // ... (implementation remains the same)
    try {
      if (accessGranted) {
        const { error: locationError } = await supabase
          .from('user_locations')
          .upsert({ user_id: userId, latitude, longitude, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (locationError) throw locationError;
      }
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ location_access: accessGranted, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (profileError) throw profileError;
      console.log(`[AuthContext] User profile access updated to ${accessGranted}. Location ${accessGranted ? 'updated' : 'not updated'}.`);
    } catch (error: any) {
      console.error('[AuthContext] Error updating user location/profile:', error.message);
    }
  };

  // --- Function to fetch coordinates (called when permission is granted) ---
  const fetchCoordinates = useCallback(async (userId: string) => {
    setIsFetchingLocation(true); // <-- Start fetching
    if (!navigator.geolocation) {
      console.error('[AuthContext] Geolocation is not supported.');
      setLocationPermissionStatus('unavailable');
      setUserCoordinates(null);
      await updateUserLocationAndProfile(userId, 0, 0, false); // Update profile status
      setIsFetchingLocation(false); // <-- Stop fetching
      return;
    }

    console.log('[AuthContext] Fetching coordinates for user:', userId);
    console.log('[AuthContext] Fetching coordinates for user:', userId);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('[AuthContext] Coordinates fetched successfully.');
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        // Ensure status is granted before setting coords (might have changed rapidly)
        setLocationPermissionStatus(prevStatus => {
            if (prevStatus !== 'denied') { // Avoid overriding a recent denial
                 setUserCoordinates(coords);
                 return 'granted';
            }
            return prevStatus; // Keep denied if it changed
        });
        // Update DB only if coords were successfully set
        // Check the state variable directly after potential update - Use coords directly
        if (coords) {
             await updateUserLocationAndProfile(userId, coords[0], coords[1], true);
        }
        setIsFetchingLocation(false); // <-- Stop fetching (success)
      },
      async (geoError) => {
        console.warn(`[AuthContext] Geolocation error (${geoError.code}): ${geoError.message}.`);
        // Update status based on error, clear coords, update profile
        let status: LocationPermissionStatus = 'unavailable';
        if (geoError.code === 1) { status = 'denied'; }
        // POSITION_UNAVAILABLE or TIMEOUT -> unavailable
        setLocationPermissionStatus(status);
        setUserCoordinates(null);
        await updateUserLocationAndProfile(userId, 0, 0, false);
        setIsFetchingLocation(false); // <-- Stop fetching (error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // Allow slightly older cache
    );
  }, []); // Removed userCoordinates dependency - fetch should not depend on current coords

  // --- Function to manually request permission (e.g., from modal button) ---
  // This primarily serves to trigger the browser prompt if status is 'prompt'/'pending'
  // The actual coordinate fetching is handled by the permission change listener or initial check.
  const requestLocationPermission = useCallback(async () => {
    if (user) {
      console.log("[AuthContext] requestLocationPermission called by UI.");
      // Re-fetch coordinates which implicitly triggers prompt if needed
      await fetchCoordinates(user.id);
    } else {
      console.warn("[AuthContext] Attempted to request location permission without a logged-in user.");
    }
  }, [user, fetchCoordinates]);

  // --- Effect for Initial Session Load ---
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[AuthContext] Error getting initial session:", error);
        setError(error.message);
      }
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      // Permission check will be handled by the Permissions API effect below
    }).finally(() => {
      setLoading(false);
    });

    // --- Listener for Auth State Changes ---
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log('[AuthContext] Auth state changed:', _event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setError(null);
        // Clear coordinates immediately on auth change, permission effect will re-fetch if needed
        if (_event === 'SIGNED_OUT' || !newSession) {
             setUserCoordinates(null);
             setLocationPermissionStatus('pending'); // Reset status on logout
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- Effect for Monitoring Geolocation Permission ---
  useEffect(() => {
    // If no user, reset state and do nothing further
    if (!user) {
      setLocationPermissionStatus('pending');
      setUserCoordinates(null);
      return;
    }

    // Check if Permissions API is supported
    if (!navigator.permissions?.query) {
      console.warn("[AuthContext] Permissions API not supported. Falling back to basic check.");
      // Fallback: try fetching coordinates directly, which handles prompt/error/success
      fetchCoordinates(user.id);
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (!permissionStatus) return;
      console.log('[AuthContext] Geolocation permission changed to:', permissionStatus.state);
      const newState = permissionStatus.state;

      if (newState === 'granted') {
        setLocationPermissionStatus('granted');
        fetchCoordinates(user.id); // Fetch coordinates when granted
      } else if (newState === 'denied') {
        setLocationPermissionStatus('denied');
        setUserCoordinates(null); // Clear coordinates when denied
      } else { // 'prompt'
        setLocationPermissionStatus('pending'); // Treat prompt as pending
        setUserCoordinates(null); // Clear coordinates while pending
      }
    };

    // Query initial status and set up listener
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      permissionStatus = result;
      handlePermissionChange(); // Handle initial state
      permissionStatus.onchange = handlePermissionChange; // Listen for changes
    }).catch(err => {
        console.error("[AuthContext] Error querying geolocation permission:", err);
        setLocationPermissionStatus('unavailable'); // Assume unavailable if query fails
        setUserCoordinates(null);
    });

    // Cleanup listener on unmount or user change
    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [user, fetchCoordinates]); // Rerun when user logs in/out or fetchCoordinates changes


  // --- Auth Functions ---
  const signOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // State updates handled by onAuthStateChange listener
    } catch (err: any) {
      setError(err.message);
      console.error('[AuthContext] Error signing out:', err);
    }
  };

  const value = {
    session, user, loading, error,
    locationPermissionStatus, userCoordinates, isFetchingLocation, // <-- Expose new state
    signOut, requestLocationPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
