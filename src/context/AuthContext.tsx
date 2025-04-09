import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import supabase from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export type LocationPermissionStatus = 'pending' | 'granted' | 'denied' | 'unavailable';

// Define a simple Profile type based on supabase_sql_queries.md
interface UserProfile {
    id: string;
    name: string;
    age?: number;
    birth_date?: string;
    languages?: string[];
    cuisines?: string[];
    location_access?: boolean;
    city?: string;
    budget?: number;
    bio?: string;
    avatar_url?: string;
    home_latitude?: number; // Needed for distance calculation
    home_longitude?: number;// Needed for distance calculation
    home_location_last_updated?: string;
    gender?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null; // <-- Add user profile state
  loading: boolean; // Combined loading state (auth + profile)
  error: string | null;
  locationPermissionStatus: LocationPermissionStatus;
  userCoordinates: [number, number] | null; // Live coordinates
  isFetchingLocation: boolean;
  signOut: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null); // <-- Add profile state
  const [loading, setLoading] = useState(true); // Covers initial auth + profile load
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
      // console.log(`[AuthContext] User profile access updated to ${accessGranted}. Location ${accessGranted ? 'updated' : 'not updated'}.`);
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

    // console.log('[AuthContext] Fetching coordinates for user:', userId);
    // console.log('[AuthContext] Fetching coordinates for user:', userId);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // console.log('[AuthContext] Coordinates received, validating...');
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (typeof latitude === 'number' && isFinite(latitude) && typeof longitude === 'number' && isFinite(longitude)) {
          // Coordinates are valid
          const validCoords: [number, number] = [latitude, longitude];

          // Attempt to set state to granted and store coordinates
          // This might be overridden if permission was denied concurrently, but that's okay.
          setLocationPermissionStatus(prevStatus => {
              if (prevStatus !== 'denied') {
                  setUserCoordinates(validCoords); // Set valid coordinates *only* if valid and not denied
                  return 'granted';
              }
              // If denied, don't set coordinates even if technically valid
              setUserCoordinates(null);
              return prevStatus; // Keep denied status
          });

          // Update DB assuming success (accessGranted = true) since we received valid coords.
          // This prioritizes storing the valid location if obtained, even if UI state briefly lagged on denial.
          // Subsequent permission checks should align DB state later if needed.
          await updateUserLocationAndProfile(userId, latitude, longitude, true);

        } else {
          // Coordinates are invalid (null, undefined, NaN, etc.)
          console.error(`[AuthContext] Invalid coordinates received: lat=${latitude}, lon=${longitude}. Setting location access to false.`);

          // Set state to reflect the issue
          setUserCoordinates(null);
          // If we previously had permission ('granted') but received invalid coordinates,
          // revert to 'pending' to allow retrying or re-prompting, rather than 'unavailable'.
          // Keep 'denied' or 'pending' if they were the previous state.
          setLocationPermissionStatus(prevStatus => {
              // console.log(`[AuthContext] Invalid coords received after success callback. Previous status: ${prevStatus}. Setting status to pending.`); // Remove log
              return prevStatus === 'denied' ? 'denied' : 'pending'; // Revert to pending unless denied
          });

          // Update DB to reflect no valid location access
          await updateUserLocationAndProfile(userId, 0, 0, false);
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
    // console.log("[AuthContext] requestLocationPermission entered. Current status:", locationPermissionStatus); // <-- Remove log

    // Only attempt to trigger the prompt if the status is currently 'pending'
    // If 'granted', the useEffect should have already fetched or user can trigger refresh below.
    // If 'denied', the user must change browser settings.
    // If 'unavailable', there's nothing we can do.
    if (locationPermissionStatus === 'pending') {
      // Call getCurrentPosition primarily to trigger the browser prompt.
      // The actual handling of success/error/state update is managed by the
      // Permissions API listener in the useEffect hook for consistency.
      // Provide dummy handlers as they are required by the API.
      if (navigator.geolocation) {
         // console.log("[AuthContext] Status is 'pending', attempting to trigger prompt via button..."); // <-- Remove log
         navigator.geolocation.getCurrentPosition(
           () => { /* console.log("[AuthContext] Prompt success callback (handled by listener)"); */ },
           () => { /* console.log("[AuthContext] Prompt error callback (handled by listener)"); */ },
           { timeout: 5000, maximumAge: Infinity } // Short timeout, don't need high accuracy just for prompt
         );
      } else {
         console.warn("[AuthContext] Geolocation not supported, cannot trigger prompt.");
      }
    } else if (locationPermissionStatus === 'denied') {
       console.warn("[AuthContext] Location permission is denied. Please check browser settings (as advised in modal).");
       // Optionally, add UI feedback here if needed
    } else if (user && locationPermissionStatus === 'granted') {
       // Allow manual refresh if already granted
       await fetchCoordinates(user.id);
    } else {
       // console.log("[AuthContext] Location status is not 'pending' or 'granted', no action taken by button.", locationPermissionStatus);
    }
  }, [user, locationPermissionStatus, fetchCoordinates]); // Added locationPermissionStatus dependency

  // --- Function to fetch user profile ---
  const fetchUserProfile = useCallback(async (userId: string) => {
    // console.log("[AuthContext] Fetching profile for user:", userId);
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Select all profile fields
        .eq('id', userId)
        .single(); // Expect only one profile per user

      if (profileError) {
        // Handle case where profile might not exist yet after signup
        if (profileError.code === 'PGRST116') { // "JSON object requested, multiple (or no) rows returned"
             console.warn(`[AuthContext] Profile not found for user ${userId}. User might need to complete profile setup.`);
             setProfile(null); // No profile exists yet
        } else {
            throw profileError; // Rethrow other errors
        }
      } else if (data) {
        // console.log("[AuthContext] Profile data fetched:", data);
        setProfile(data as UserProfile);
      } else {
         setProfile(null); // Should not happen with .single() unless error occurred
      }
    } catch (err: any) {
      console.error('[AuthContext] Error fetching user profile:', err.message);
      setError(err.message);
      setProfile(null);
    }
  }, []);


  // --- Effect for Initial Session & Profile Load ---
  useEffect(() => {
    setLoading(true);
    setError(null); // Clear previous errors

    const fetchInitialData = async () => {
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            const currentSession = sessionData?.session ?? null;
            const currentUser = currentSession?.user ?? null;

            setSession(currentSession);
            setUser(currentUser);

            if (currentUser) {
                await fetchUserProfile(currentUser.id); // Fetch profile if user exists
            } else {
                setProfile(null); // No user, no profile
            }
        } catch (err: any) {
            console.error("[AuthContext] Error during initial data fetch:", err.message);
            setError(err.message);
            setSession(null);
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    fetchInitialData();

    // --- Listener for Auth State Changes ---
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => { // Make async to await profile fetch
        // console.log('[AuthContext] Auth state changed:', _event, newSession?.user?.id);
        const currentUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(currentUser);
        setError(null); // Clear errors on auth change

        if (currentUser) {
            // If signed in or user updated, fetch/refresh profile
            await fetchUserProfile(currentUser.id);
        } else {
            // If signed out, clear profile and location data
            setProfile(null);
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
      // console.log('[AuthContext] Geolocation permission changed to:', permissionStatus.state);
      const newState = permissionStatus.state;

      if (newState === 'granted') {
        setLocationPermissionStatus('granted');
        fetchCoordinates(user.id); // Fetch coordinates when granted
      } else if (newState === 'denied') {
        setLocationPermissionStatus('denied');
        setUserCoordinates(null); // Clear coordinates when denied
      } else { // 'prompt' / 'pending'
        setLocationPermissionStatus('pending'); // Treat prompt as pending
        setUserCoordinates(null); // Clear coordinates while pending
        // Attempt to trigger the prompt immediately if the initial state is 'prompt'
        // This might help if the button click isn't working reliably
        if (newState === 'prompt' && navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(
               () => { /* console.log("[AuthContext] Prompt success callback (handled by listener)"); */ },
               () => { /* console.log("[AuthContext] Prompt error callback (handled by listener)"); */ },
               { timeout: 5000, maximumAge: Infinity }
             );
        }
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
    session, user, profile, loading, error, // <-- Expose profile
    locationPermissionStatus, userCoordinates, isFetchingLocation,
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
