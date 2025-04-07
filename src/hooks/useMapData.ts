import { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import { City } from '../types';
import { cities } from '../data/cities';
import { sortCitiesByPopulation, filterCitiesByCountry, isCityWithinRadius } from '../utils/mapUtils'; // Import isCityWithinRadius
import supabase from '../utils/supabaseClient'; // Use default import for Supabase client
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user ID
import { mockUsers } from '../data/mockUsers'; // Import mock users

// Update the structure for user data to include name
// Export MapUser type so it can be imported elsewhere
export interface MapUser {
  user_id: string;
  latitude: number;
  longitude: number;
  name: string; // Added name
  // Add new optional fields from user profile
  is_local?: string | null;
  budget?: number | null;
  bio?: string | null;
  age?: number | null; // Added age
  // Add fields from profiles table
  avatar_url?: string | null;
  gender?: string | null;
  languages?: string[] | null;
  cuisines?: string[] | null;
}

interface Filters {
  country: string | null;
  population: {
    min: number;
    max: number;
  };
  search: string | null;
  distance: number | null; // Distance filter in km
  // New user filters
  is_local: string[] | null; // Array of selected local statuses (e.g., ["Local", "Expat"])
  budget: number[] | null; // Array of selected budget levels (e.g., [1, 3])
  gender: string[] | null; // <-- Add gender filter
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
  // Add new filter functions
  filterByLocalStatus: (statuses: string[] | null) => void;
  filterByBudget: (budgets: number[] | null) => void;
  filterByGender: (genders: string[] | null) => void; // <-- Add gender filter function
  selectCity: (cityId: number | null) => void;
  getTopCities: (count: number) => City[];
  resetFilters: () => void;
  zoomToCity: (cityId: number) => [number, number];
}

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
    // Initialize new filters
    is_local: null,
    budget: null,
    gender: null, // <-- Initialize gender filter
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

  // Memo for users filtered by Search Term, Distance, Local Status, and Budget
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

    // Apply Local Status Filter
    if (filters.is_local && filters.is_local.length > 0) {
        result = result.filter(u => u.is_local && filters.is_local!.includes(u.is_local));
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


    return result;
  }, [filters, allOtherUsers, userCoordinates]); // Keep dependencies

  // --- Data Fetching ---

  // Fetch other user locations/names using the snapped locations function AND merge profile data
  const fetchOtherUserLocations = async (currentUserId: string | undefined) => {
      setLoadingOtherUsers(true);
      setErrorOtherUsers(null);
      try {
          // 1. Call the RPC function to get base user data (location, name, etc.)
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_snapped_map_users');

          if (rpcError) {
              console.error("Supabase RPC error calling get_snapped_map_users:", rpcError);
              throw new Error(`Database RPC error: ${rpcError.message}`);
          }

          let baseUsers: MapUser[] = [];
          if (rpcData) {
              // Filter out the current user's location if logged in
              // Use 'any' temporarily if RPC return type isn't strictly MapUser yet
              baseUsers = currentUserId
                  ? rpcData.filter((loc: any) => loc.user_id !== currentUserId)
                  : rpcData;
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
                  .select('id, avatar_url, gender, languages, cuisines')
                  .in('id', userIdsToFetchProfiles);

              if (profilesError) {
                  console.error("Supabase error fetching profiles data:", profilesError);
                  // Proceed but log the error, enrichment will be partial.
                  setErrorOtherUsers("Could not load all profile details."); // Set a non-blocking error
              }

              // 3. Merge profile data into the user list
              if (profilesData) {
                  const profilesMap = new Map(profilesData.map(p => [p.id, p]));
                  enrichedUsers = enrichedUsers.map(user => {
                      if (profilesMap.has(user.user_id)) {
                          const profile = profilesMap.get(user.user_id)!;
                          return {
                              ...user,
                              avatar_url: profile.avatar_url,
                              gender: profile.gender,
                              languages: profile.languages,
                              cuisines: profile.cuisines,
                          };
                      }
                      return user; // Return user as is if no profile found (or mock user)
                  });
              }
          }

          setAllOtherUsers(enrichedUsers); // Store the final merged list

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

  // --- Filter Update Functions ---
  const filterByCountry = (country: string | null) => { setFilters(prev => ({ ...prev, country, distance: null })); }; // Reset distance on country change
  const filterByPopulation = (min: number, max: number) => { setFilters(prev => ({ ...prev, population: { min, max }, distance: null })); }; // Reset distance
  const filterBySearch = (term: string | null) => { setFilters(prev => ({ ...prev, search: term })); }; // Keep distance
  const filterByDistance = (distance: number | null) => {
      // When setting distance, clear country/population filters as they hide users
      setFilters(prev => ({
          ...prev,
          distance: distance,
          country: null,
          population: { min: 0, max: Number.MAX_SAFE_INTEGER }
      }));
 };
 // Add new filter functions
 const filterByLocalStatus = (statuses: string[] | null) => {
     setFilters(prev => ({ ...prev, is_local: statuses && statuses.length > 0 ? statuses : null }));
 };
 const filterByBudget = (budgets: number[] | null) => {
     setFilters(prev => ({ ...prev, budget: budgets && budgets.length > 0 ? budgets : null }));
 };
const filterByGender = (genders: string[] | null) => {
    setFilters(prev => ({ ...prev, gender: genders && genders.length > 0 ? genders : null }));
};

 // Update resetFilters to include new filters
 const resetFilters = () => {
     setFilters({
         country: null,
         population: { min: 0, max: Number.MAX_SAFE_INTEGER },
         search: null,
         distance: null,
         is_local: null, // Reset local status
         budget: null,   // Reset budget
         gender: null,   // <-- Reset gender
     });
 };

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
    // Add new filter functions to return object
    filterByLocalStatus,
    filterByBudget,
    filterByGender, // <-- Return gender filter function
    selectCity,
    getTopCities,
    resetFilters,
    zoomToCity
  };
}; // End of useMapData hook
