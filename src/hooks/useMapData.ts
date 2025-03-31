import { useState, useEffect, useMemo } from 'react';
import { City } from '../types';
import { cities } from '../data/cities';
import { sortCitiesByPopulation, filterCitiesByCountry, isCityWithinRadius } from '../utils/mapUtils'; // Import isCityWithinRadius
import supabase from '../utils/supabaseClient'; // Use default import for Supabase client
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user ID

// Update the structure for user data to include name
// Export MapUser type so it can be imported elsewhere
export interface MapUser {
  user_id: string;
  latitude: number;
  longitude: number;
  name: string; // Added name
}

interface Filters {
  country: string | null;
  population: {
    min: number;
    max: number;
  };
  search: string | null;
  distance: number | null; // Distance filter in km
}

// Update MapData interface
interface MapData {
  cities: City[];
  loading: boolean; // Represents loading state for cities
  error: string | null; // Represents error state for cities
  selectedCity: City | null;
  filteredCities: City[]; // Cities filtered by country, population, search
  filteredUsers: MapUser[]; // Users filtered by search (and hidden by country/pop filters)
  // Consider adding distance-filtered versions if needed separately
  allOtherUsers: MapUser[]; // Raw list of other users fetched
  loadingOtherUsers: boolean;
  errorOtherUsers: string | null;
  filters: Filters; // <-- Add filters state to the interface
  filterByCountry: (country: string | null) => void;
  filterByPopulation: (min: number, max: number) => void;
  filterBySearch: (term: string | null) => void;
  filterByDistance: (distance: number | null) => void; // Keep this for map radius circle
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
  const [loadingCities, setLoadingCities] = useState<boolean>(true);
  const [errorCities, setErrorCities] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filters, setFilters] = useState<Filters>({
    country: null,
    population: { min: 0, max: Number.MAX_SAFE_INTEGER },
    search: null,
    distance: null // Distance filter state
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

  // Memo for users filtered by Search Term and Distance, hidden by Country/Pop filters
  const filteredUsers = useMemo(() => {
    // If Country or Population filters are active, hide all users (Option A)
    if (filters.country || filters.population.min > 0 || filters.population.max < Number.MAX_SAFE_INTEGER) {
      return [];
    }

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


    return result;
  }, [filters, allOtherUsers, userCoordinates]); // Add dependencies

  // --- Data Fetching ---

  // Fetch other user locations/names from the map_users view
  const fetchOtherUserLocations = async (currentUserId: string | undefined) => {
    setLoadingOtherUsers(true);
    setErrorOtherUsers(null);
    try {
      // Query the view instead of the table
      const { data, error } = await supabase
        .from('map_users') // <-- Query the view
        .select('user_id, latitude, longitude, name'); // <-- Select name as well

      if (error) {
        console.error("Supabase error fetching map_users view:", error);
        throw new Error(`Database error: ${error.message}`); // More specific error
      }

      if (data) {
        // Filter out the current user's location
        const filteredData = currentUserId
          ? data.filter((loc: MapUser) => loc.user_id !== currentUserId) // Use MapUser type
          : data;
        setAllOtherUsers(filteredData); // Store in the raw state
      } else {
        setAllOtherUsers([]);
      }
    } catch (err: any) {
      console.error("Error fetching other user data:", err);
      setErrorOtherUsers(err.message || "Failed to load other user data."); // Use error message if available
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

    if (user) { // Only fetch data if user is logged in
      loadInitialData();
    } else {
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
  const resetFilters = () => { setFilters({ country: null, population: { min: 0, max: Number.MAX_SAFE_INTEGER }, search: null, distance: null }); };

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
    filteredUsers,      // Filtered users based on search/distance (hidden by country/pop)
    allOtherUsers,      // Raw user list
    loadingOtherUsers,
    errorOtherUsers,
    filterByCountry,
    filterByPopulation,
    filterBySearch,
    filterByDistance,
    selectCity,
    getTopCities,
    resetFilters,
    zoomToCity
  };
};
