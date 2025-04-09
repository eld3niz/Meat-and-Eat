import { useState, useEffect, useMemo, useRef, useCallback } from 'react'; // Added useRef and useCallback
import { City } from '../types';
import { cities } from '../data/cities';
import { sortCitiesByPopulation, filterCitiesByCountry, isCityWithinRadius } from '../utils/mapUtils'; // Import isCityWithinRadius
import supabase from '../utils/supabaseClient'; // Use default import for Supabase client
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user ID
import { mockUsers } from '../data/mockUsers'; // Import mock users

// Update the structure for user data to include name
// Export MapUser type so it can be imported elsewhere
// Define a type for the profile data fetched separately
interface UserProfileData {
  id: string;
  avatar_url?: string | null;
  gender?: string | null;
  languages?: string[] | null;
  cuisines?: string[] | null;
  home_latitude?: number | null; // Added home location
  home_longitude?: number | null; // Added home location
  age?: number | null; // Keep age here
}

export interface MapUser {
  user_id: string;
  latitude: number;
  longitude: number;
  name: string;
  // is_local?: string | null; // Removed, will use derivedStatus
  budget?: number | null;
  bio?: string | null;
  age?: number | null; // Age from RPC/Profile
  avatar_url?: string | null; // From Profile
  gender?: string | null; // From Profile
  languages?: string[] | null; // From Profile
  cuisines?: string[] | null; // From Profile
  home_latitude?: number | null; // From Profile
  home_longitude?: number | null; // From Profile
  derivedStatus?: 'Local' | 'Traveller' | null; // Calculated status
  travel_status?: string | null; // Added travel status (e.g., "Explorer", "On a break")
  distance?: number | null; // <-- ADD THIS: Distance from current user in km
}

interface Filters {
  country: string | null;
  population: {
    min: number;
    max: number;
  };
  search: string | null;
  distance: number | null; // Distance filter in km
  // User filters
  localStatus: string[] | null; // Renamed from is_local, uses derivedStatus
  budget: number[] | null;
  gender: string[] | null;
  age: {
    min: number;
    max: number;
  };
  languages: string[] | null; // Filter by languages
  cuisines: string[] | null; // Filter by cuisines
}

// Update MapData interface
interface MapData {
  cities: City[];
  loading: boolean; // Represents loading state for cities
  error: string | null; // Represents error state for cities
  selectedCity: City | null;
  filteredCities: City[]; // Cities filtered by country, population, search
  filteredUsers: MapUser[]; // Users filtered by all active filters
  // Consider adding distance-filtered versions if needed separately
  allOtherUsers: MapUser[]; // Raw list of other users fetched
  loadingOtherUsers: boolean;
  errorOtherUsers: string | null;
  filters: Filters; // <-- Add filters state to the interface
  filterByCountry: (country: string | null) => void;
  filterByPopulation: (min: number, max: number) => void;
  filterBySearch: (term: string | null) => void;
  filterByDistance: (distance: number | null) => void; // Keep this for map radius circle
  // User filter functions
  filterByLocalStatus: (statuses: string[] | null) => void; // Renamed prop
  filterByBudget: (budgets: number[] | null) => void;
  filterByGender: (genders: string[] | null) => void;
  filterByAge: (min: number, max: number) => void;
  filterByLanguages: (languages: string[] | null) => void; // Add language filter function
  filterByCuisines: (cuisines: string[] | null) => void; // Add cuisine filter function
  selectCity: (cityId: number | null) => void;
  getTopCities: (count: number) => City[];
  resetFilters: () => void;
  zoomToCity: (cityId: number) => [number, number];
}

// --- Debounce Utility ---
// Basic debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Return a function that schedules func execution
  return (...args: Parameters<F>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null; // Clear timeoutId after execution
      func(...args); // Execute the original function
    }, waitFor);
  };
}

const DEBOUNCE_DELAY = 300; // ms for filter debounce

/**
 * Custom Hook für die Verwaltung der Kartendaten (Städte und Benutzerstandorte)
 * @returns MapData-Objekt mit Datenlisten und Hilfsfunktionen
 */
export const useMapData = (): MapData => {
  const { user, userCoordinates } = useAuth(); // Get the current user and their coordinates
  const hasFetchedInitialData = useRef(false); // Flag to track initial fetch
  const [loadingCities, setLoadingCities] = useState<boolean>(true);
  const [errorCities, setErrorCities] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filters, setFilters] = useState<Filters>({
    country: null,
    population: { min: 0, max: Number.MAX_SAFE_INTEGER },
    search: null,
    distance: null, // Distance filter state
    // Initialize user filters
    localStatus: null, // Renamed from is_local
    budget: null,
    gender: null,
    age: { min: 18, max: 99 },
    languages: null, // Initialize language filter
    cuisines: null, // Initialize cuisine filter
  });

  // State for all fetched other user locations (including name)
  const [allOtherUsers, setAllOtherUsers] = useState<MapUser[]>([]);
  const [loadingOtherUsers, setLoadingOtherUsers] = useState<boolean>(true);
  const [errorOtherUsers, setErrorOtherUsers] = useState<string | null>(null);

  // --- Filtering Logic ---

  // Memo for cities filtered by Country, Population, and Search Term
  const filteredCities = useMemo(() => {
    let result = cities;
    // Filter by Country
    if (filters.country) {
      result = filterCitiesByCountry(result, filters.country);
    }
    // Filter by Population
    result = result.filter(city =>
      city.population >= filters.population.min &&
      city.population <= filters.population.max
    );
    // Filter by Search Term (City Name or Country)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(city =>
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm)
      );
    }
    // Apply Distance Filter if active
    if (filters.distance !== null && userCoordinates) {
        const [userLat, userLng] = userCoordinates;
        result = result.filter(city => isCityWithinRadius(userLat, userLng, city, filters.distance!));
    }

    return result;
  }, [filters, userCoordinates]); // Add userCoordinates dependency

  // Memo for users filtered by Search Term, Distance, Local Status, Budget, Gender, and Age
  const filteredUsers = useMemo(() => {
    let result = allOtherUsers;

    // Filter by Search Term (User Name)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(searchTerm));
    }

    // Apply Distance Filter if active
    if (filters.distance !== null && userCoordinates) {
        const [userLat, userLng] = userCoordinates;
        // Adapt isCityWithinRadius or create a similar function for MapUser type
        const isUserWithinRadius = (lat: number, lng: number, user: MapUser, radiusKm: number): boolean => {
            const R = 6371; // Earth radius in km
            const dLat = (user.latitude - lat) * Math.PI / 180;
            const dLon = (user.longitude - lng) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(user.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance <= radiusKm;
        };
        result = result.filter(u => isUserWithinRadius(userLat, userLng, u, filters.distance!));
    }

    // Apply Local Status Filter (using derivedStatus)
    if (filters.localStatus && filters.localStatus.length > 0) {
        result = result.filter(u => u.derivedStatus && filters.localStatus!.includes(u.derivedStatus));
    }

    // Apply Budget Filter
    if (filters.budget && filters.budget.length > 0) {
        result = result.filter(u => u.budget && filters.budget!.includes(u.budget));
    }

    // Apply Gender Filter
    if (filters.gender && filters.gender.length > 0) {
        // Map frontend labels ('Male', 'Female', 'Divers') to potential backend values if needed,
        // assuming backend stores 'male', 'female', 'divers' (case-insensitive check is safer)
        const selectedGendersLower = filters.gender.map(g => g.toLowerCase());
        result = result.filter(u => u.gender && selectedGendersLower.includes(u.gender.toLowerCase()));
    }
// Apply Age Filter
if (filters.age) {
  result = result.filter(u =>
    u.age !== null && u.age !== undefined && // Ensure age exists
    u.age >= filters.age.min &&
    u.age <= filters.age.max
  );
}
// Apply Languages Filter
if (filters.languages && filters.languages.length > 0) {
  result = result.filter(u =>
    u.languages && filters.languages!.every(lang => u.languages!.includes(lang))
  );
}

// Apply Cuisines Filter
if (filters.cuisines && filters.cuisines.length > 0) {
  result = result.filter(u =>
    u.cuisines && filters.cuisines!.every(cuisine => u.cuisines!.includes(cuisine))
  );
}

return result;

    return result;
  }, [filters, allOtherUsers, userCoordinates]); // Keep dependencies

  // --- Data Fetching ---

  // Fetch other user locations/names using the snapped locations function AND merge profile data
  const fetchOtherUserLocations = async (currentUserId: string | undefined) => {
      setLoadingOtherUsers(true);
      setErrorOtherUsers(null);
      try {
          // 1. Call the RPC function to get base user data (location, name, budget, bio, age)
          // Note: The RPC function `get_snapped_map_users` already returns age.
          // It DOES NOT return home_latitude, home_longitude, gender, languages, cuisines, avatar_url.
          // These need to be fetched from the `profiles` table separately.
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_snapped_map_users');

          if (rpcError) {
              console.error("Supabase RPC error calling get_snapped_map_users:", rpcError);
              throw new Error(`Database RPC error: ${rpcError.message}`);
          }

          let baseUsers: MapUser[] = [];
          if (rpcData) {
              // Filter out the current user and map to initial MapUser structure
              const processRpcData = (userRpcData: any): MapUser => ({
                  user_id: userRpcData.user_id,
                  latitude: userRpcData.latitude,
                  longitude: userRpcData.longitude,
                  name: userRpcData.name,
                  budget: userRpcData.budget,
                  bio: userRpcData.bio,
                  age: userRpcData.age, // Age comes from RPC now
                  // Other fields will be added from profile fetch
              });

              baseUsers = currentUserId
                  ? rpcData.filter((loc: any) => loc.user_id !== currentUserId).map(processRpcData)
                  : rpcData.map(processRpcData);
          }

          // Include mock users regardless of fetch success/failure for base data
          const usersToEnrich = [...baseUsers, ...mockUsers];
          const userIdsToFetchProfiles = usersToEnrich
              .map(u => u.user_id)
              // Correctly filter out mock user IDs which seem to follow 'mockuser_N' pattern
              .filter(id => !id.startsWith('mockuser_'));

          let enrichedUsers = [...usersToEnrich]; // Start with base + mock users

          // 2. Fetch profile data for non-mock users if IDs exist
          if (userIdsToFetchProfiles.length > 0) {
              const { data: profilesData, error: profilesError } = await supabase
                  .from('profiles')
                  // Select all needed fields including home location and age (as fallback)
                  .select('id, avatar_url, gender, languages, cuisines, home_latitude, home_longitude, age')
                  .in('id', userIdsToFetchProfiles);

              if (profilesError) {
                  console.error("Supabase error fetching profiles data:", profilesError);
                  // Proceed but log the error, enrichment will be partial.
                  setErrorOtherUsers("Could not load all profile details."); // Set a non-blocking error
              }

              // 3. Merge profile data into the user list
              if (profilesData) {
                  const profilesMap = new Map<string, UserProfileData>(profilesData.map(p => [p.id, p]));

                  // Function to calculate distance (Haversine)
                  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                      const R = 6371; // Radius of the Earth in km
                      const dLat = (lat2 - lat1) * Math.PI / 180;
                      const dLon = (lon2 - lon1) * Math.PI / 180;
                      const a =
                          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                  };

                  enrichedUsers = enrichedUsers.map(user => {
                      const profile = profilesMap.get(user.user_id);
                      let calculatedDistance: number | null = null; // <-- Initialize distance

                      // Calculate distance if userCoordinates are available
                      if (userCoordinates && user.latitude != null && user.longitude != null) {
                          calculatedDistance = calculateDistanceKm(
                              userCoordinates[0],
                              userCoordinates[1],
                              user.latitude,
                              user.longitude
                          );
                      }

                      if (profile) {
                          // Derive status
                          let derivedStatus: MapUser['derivedStatus'] = null;
                          const homeLat = profile.home_latitude;
                          const homeLng = profile.home_longitude;
                          const currentLat = user.latitude;
                          const currentLng = user.longitude;
                          const LOCAL_THRESHOLD_KM = 50; // Define threshold for being "Local"

                          if (homeLat != null && homeLng != null && currentLat != null && currentLng != null) {
                              const distance = calculateDistanceKm(currentLat, currentLng, homeLat, homeLng);
                              derivedStatus = distance <= LOCAL_THRESHOLD_KM ? 'Local' : 'Traveller';
                          } else {
                              derivedStatus = 'Traveller'; // Default to Traveller if home location isn't set
                          }

                          return {
                              ...user,
                              // Merge profile data, potentially overwriting age from RPC if profile has it (consistency)
                              age: profile.age ?? user.age, // Prefer profile age if available
                              avatar_url: profile.avatar_url,
                              gender: profile.gender,
                              languages: profile.languages,
                              cuisines: profile.cuisines,
                              home_latitude: profile.home_latitude,
                              home_longitude: profile.home_longitude,
                              derivedStatus: derivedStatus, // Set calculated status
                              distance: calculatedDistance, // <-- STORE CALCULATED DISTANCE
                          };
                      }
                      // For mock users or users without profile data
                      return {
                          ...user,
                          derivedStatus: 'Traveller',
                          distance: calculatedDistance // <-- STORE CALCULATED DISTANCE
                      };
                  });
              } else {
                 // If profile fetch fails entirely, still set default status for base users
                 enrichedUsers = enrichedUsers.map(user => ({ ...user, derivedStatus: 'Traveller' }));
              }
          } else {
             // If no real users, process mock users
             enrichedUsers = enrichedUsers.map(user => ({ ...user, derivedStatus: 'Traveller' }));
          }


          setAllOtherUsers(enrichedUsers); // Store the final merged list with derived status

      } catch (err: any) {
          console.error("Error fetching and merging other user data:", err);
          setErrorOtherUsers(err.message || "Failed to load other user data.");
          // Fallback to only mock users if the entire process fails critically
          setAllOtherUsers([...mockUsers]);
      } finally {
          setLoadingOtherUsers(false);
      }
  };

  // Load initial data (cities and user locations)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingCities(true);
      setErrorCities(null);
      setLoadingOtherUsers(true); // Set user loading true at the start
      setErrorOtherUsers(null);

      // Simulate loading cities
      const loadCitiesPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      }).finally(() => setLoadingCities(false));

      try {
        // Fetch cities (simulated) and user locations concurrently
        await Promise.all([
          loadCitiesPromise,
          fetchOtherUserLocations(user?.id) // Fetch users (handles its own loading/error state)
        ]);
      } catch (err) {
        // This catch might only be relevant if city loading could actually reject
        console.error("Error during initial data load:", err);
        if (!errorCities) {
          setErrorCities('Fehler beim Laden der initialen Kartendaten.');
        }
      }
      // Note: Overall loading state is implicitly handled by individual loading flags
    };

    if (user && !hasFetchedInitialData.current) { // Only fetch data if user is logged in AND first time
      loadInitialData().then(() => {
        hasFetchedInitialData.current = true; // Set flag after successful fetch attempt
      });
    } else if (!user) { // Reset flag if user logs out
      hasFetchedInitialData.current = false;
      // Reset state if user logs out
      setLoadingCities(false);
      setLoadingOtherUsers(false);
      setAllOtherUsers([]); // Reset raw user data
      setErrorCities(null);
      setErrorOtherUsers(null);
    }

  }, [user]); // Re-run effect when user logs in or out

  // --- Debounced Filter Update Logic ---

  // Debounced function to update a part of the filters state
  // Use useCallback to ensure the debounced function itself is stable unless DEBOUNCE_DELAY changes
  const debouncedSetFilters = useCallback(
    debounce((newFilterValues: Partial<Filters>) => {
      // Use functional update form of setFilters
      setFilters(prev => ({ ...prev, ...newFilterValues }));
    }, DEBOUNCE_DELAY),
    [DEBOUNCE_DELAY] // Dependency array for useCallback
  );

  // --- Filter Update Functions (Using Debounced Setter) ---
  // Wrap each filter function with useCallback to ensure stability for consumers of the hook
  const filterByCountry = useCallback((country: string | null) => {
    debouncedSetFilters({ country, distance: null }); // Reset distance on country change
  }, [debouncedSetFilters]);

  const filterByPopulation = useCallback((min: number, max: number) => {
    debouncedSetFilters({ population: { min, max }, distance: null }); // Reset distance
  }, [debouncedSetFilters]);

  const filterBySearch = useCallback((term: string | null) => {
    debouncedSetFilters({ search: term }); // Keep distance
  }, [debouncedSetFilters]);

  const filterByDistance = useCallback((distance: number | null) => {
    // When setting distance, clear country/population filters as they hide users
    debouncedSetFilters({
      distance: distance,
      country: null,
      population: { min: 0, max: Number.MAX_SAFE_INTEGER }
    });
  }, [debouncedSetFilters]);

  const filterByLocalStatus = useCallback((statuses: string[] | null) => {
    debouncedSetFilters({ localStatus: statuses && statuses.length > 0 ? statuses : null });
  }, [debouncedSetFilters]);

  const filterByBudget = useCallback((budgets: number[] | null) => {
    debouncedSetFilters({ budget: budgets && budgets.length > 0 ? budgets : null });
  }, [debouncedSetFilters]);

  const filterByGender = useCallback((genders: string[] | null) => {
    debouncedSetFilters({ gender: genders && genders.length > 0 ? genders : null });
  }, [debouncedSetFilters]);

  const filterByAge = useCallback((min: number, max: number) => {
    debouncedSetFilters({ age: { min, max } });
  }, [debouncedSetFilters]);

  const filterByLanguages = useCallback((languages: string[] | null) => {
    debouncedSetFilters({ languages: languages && languages.length > 0 ? languages : null });
  }, [debouncedSetFilters]);

  const filterByCuisines = useCallback((cuisines: string[] | null) => {
    debouncedSetFilters({ cuisines: cuisines && cuisines.length > 0 ? cuisines : null });
  }, [debouncedSetFilters]);

 // Reset filters should NOT be debounced - make it immediate
 const resetFilters = useCallback(() => {
      setFilters({ // Direct call to setFilters
          country: null,
          population: { min: 0, max: Number.MAX_SAFE_INTEGER },
          search: null,
          distance: null,
          localStatus: null,
          budget: null,
          gender: null,
          age: { min: 18, max: 99 },
          languages: null,
          cuisines: null,
      });
  }, []); // No dependencies needed if it only uses setFilters

  // --- City selection and zooming (no changes needed) ---
  const selectCity = (cityId: number | null) => {
    if (cityId === null) { setSelectedCity(null); return; }
    const city = cities.find(c => c.id === cityId) || null;
    setSelectedCity(city);
  };
  const zoomToCity = (cityId: number): [number, number] => {
    const city = cities.find(c => c.id === cityId);
    if (!city) { return [20, 0]; }
    return [city.latitude, city.longitude];
  };
  const getTopCities = (count: number): City[] => {
    return sortCitiesByPopulation(cities).slice(0, count);
  };

  // Update the returned object
  return {
    cities: cities, // <-- Return the original cities array
    filters,                // <-- Return the current filters state
    loading: loadingCities, // City loading
    error: errorCities,     // City error
    selectedCity,
    filteredCities,     // Filtered cities based on all filters
    filteredUsers,      // Filtered users based on all active filters
    allOtherUsers,      // Raw user list
    loadingOtherUsers,
    errorOtherUsers,
    filterByCountry,
    filterByPopulation,
    filterBySearch,
    filterByDistance,
    // User filter functions
    filterByLocalStatus, // Renamed prop
    filterByBudget,
    filterByGender,
    filterByAge,
    filterByLanguages, // Return language filter function
    filterByCuisines, // Return cuisine filter function
    selectCity,
    getTopCities,
    resetFilters,
    zoomToCity
  };
}; // End of useMapData hook
