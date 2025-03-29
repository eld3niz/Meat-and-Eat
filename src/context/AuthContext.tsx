import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import supabase from '../utils/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
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

  // --- Location Handling Functions ---

  const updateUserLocation = async (userId: string, latitude: number, longitude: number) => {
    try {
      // Upsert location - inserts if no row matches user_id, updates if it does
      // Ensure user_id has a unique constraint in Supabase for onConflict to work reliably
      const { error: locationError } = await supabase
        .from('user_locations')
        .upsert({ user_id: userId, latitude, longitude, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

      if (locationError) throw locationError;

      // Update profile status to indicate access granted
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ location_access: true, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      console.log('User location and profile access updated successfully.');

    } catch (error: any) {
      console.error('Error updating user location/profile:', error.message);
      // Consider setting a specific error state if needed for UI feedback
    }
  };

  const handleLocationPermission = async (userId: string) => {
     if (!navigator.geolocation) {
       console.error('Geolocation is not supported by this browser.');
       // Update profile to reflect lack of support/access
       try {
         await supabase.from('profiles').update({ location_access: false, updated_at: new Date().toISOString() }).eq('id', userId);
       } catch (profileError: any) {
         console.error('Error updating profile for unsupported geolocation:', profileError.message);
       }
       return;
     }

     console.log('Requesting geolocation permission for user:', userId);
     navigator.geolocation.getCurrentPosition(
       async (position) => {
         // Success: Update location and profile
         console.log('Geolocation permission granted. Updating location...');
         await updateUserLocation(userId, position.coords.latitude, position.coords.longitude);
       },
       async (error) => {
         // Error/Denial: Update profile only
         console.warn(`Geolocation error (${error.code}): ${error.message}. Updating profile access to false.`);
         try {
           const { error: profileError } = await supabase
             .from('profiles')
             .update({ location_access: false, updated_at: new Date().toISOString() })
             .eq('id', userId);
           if (profileError) throw profileError;
           console.log('User profile updated to reflect denied/failed location access.');
         } catch (profileError: any) {
           console.error('Error updating profile after location denial/error:', profileError.message);
         }
       },
       {
         // Geolocation options
         enableHighAccuracy: true, // Request more accurate position
         timeout: 10000,        // Maximum time (in ms) to wait for a position
         maximumAge: 0          // Don't use a cached position
       }
     );
  };

  // --- Auth Effect Hook ---

  useEffect(() => {
    // Get initial session and handle location
    const getInitialSessionAndLocation = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Handle location permission after getting initial session
          await handleLocationPermission(data.session.user.id); 
        }
      } catch (error: any) {
        setError(error.message);
        console.error('Error loading initial session:', error);
      } finally {
        // Set loading false only after initial session and location attempt
        setLoading(false); 
      }
    };

    getInitialSessionAndLocation();

    // Listen for subsequent auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event); // Log the event type
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        
        // Handle location only when user signs in, not on sign out or other events
        if (event === 'SIGNED_IN' && currentUser) {
          console.log('User signed in, handling location permission...');
          await handleLocationPermission(currentUser.id);
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out.');
        }
        
        // Keep loading state consistent if needed, though initial load is primary concern
        // setLoading(false); // Might cause flicker if session changes rapidly
      }
    );

    // Cleanup on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up

  // --- Auth Functions ---

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // State updates handled by onAuthStateChange listener
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    loading,
    error,
    signOut,
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
