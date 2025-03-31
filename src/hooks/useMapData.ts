import { useState, useEffect, useMemo } from 'react';
import { City } from '../types';
import { cities } from '../data/cities';
import { sortCitiesByPopulation, filterCitiesByCountry } from '../utils/mapUtils';
import { supabase } from '../utils/supabaseClient'; // Import Supabase client
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user ID

// Define the structure for user location data
interface UserLocation {
  user_id: string;
  latitude: number;
  longitude: number;
}

interface Filters {
  country: string | null;
  population: {
    min: number;
    max: number;
  };
  search: string | null;
  distance: number | null;
}

// Update MapData interface to include new state
interface MapData {
  cities: City[];
  loading: boolean; // Represents loading state for cities
  error: string | null; // Represents error state for cities
  selectedCity: City | null;
  filteredCities: City[];
  otherUserLocations: UserLocation[]; // Add state for other users' locations
  loadingOtherUsers: boolean;        // Add loading state for other users
  errorOtherUsers: string | null;    // Add error state for other users
  filterByCountry: (country: string | null) => void;
  filterByPopulation: (min: number, max: number) => void;
  filterBySearch: (term: string | null) => void;
  filterByDistance: (distance: number | null) => void;
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
  const { user } = useAuth(); // Get the current user
  const [loadingCities, setLoadingCities] = useState<boolean>(true); // Renamed for clarity
  const [errorCities, setErrorCities] = useState<string | null>(null); // Renamed for clarity
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filters, setFilters] = useState<Filters>({
    country: null,
    population: { min: 0, max: Number.MAX_SAFE_INTEGER },
    search: null,
    distance: null
  });

  // Add state for other user locations
  const [otherUserLocations, setOtherUserLocations] = useState<UserLocation[]>([]);
  const [loadingOtherUsers, setLoadingOtherUsers] = useState<boolean>(true);
  const [errorOtherUsers, setErrorOtherUsers] = useState<string | null>(null);

  // Gefilterte Städte basierend auf den aktiven Filtern
  const filteredCities = useMemo(() => {
    let result = cities;
    if (filters.country) {
      result = filterCitiesByCountry(result, filters.country);
    }
    result = result.filter(city =>
      city.population >= filters.population.min &&
      city.population <= filters.population.max
    );
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(city =>
        city.name.toLowerCase().includes(searchTerm) ||
        city.country.toLowerCase().includes(searchTerm)
      );
    }
    return result;
  }, [filters]);

  // Fetch other user locations from Supabase
  const fetchOtherUserLocations = async (currentUserId: string | undefined) => {
    setLoadingOtherUsers(true);
    setErrorOtherUsers(null);
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude'); // Select necessary fields

      if (error) {
        console.error("Supabase error fetching other user locations:", error);
        throw new Error(error.message); // Throw the actual error message
      }

      if (data) {
        // Filter out the current user's location
        const filteredData = currentUserId
          ? data.filter((loc: UserLocation) => loc.user_id !== currentUserId) // Explicitly type 'loc'
          : data;
        setOtherUserLocations(filteredData);
      } else {
        setOtherUserLocations([]); // Set to empty array if no data
      }
    } catch (err: any) {
      console.error("Error fetching other user locations:", err);
      setErrorOtherUsers("Failed to load other user locations."); // User-friendly message
    } finally {
      setLoadingOtherUsers(false);
    }
  };


  // Load initial data (cities and user locations)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingCities(true);
      setErrorCities(null);

      // Simulate loading cities (replace with actual API call if needed)
      const loadCitiesPromise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulate success/error for cities
          // setLoadingCities(false); // Set loading false inside the simulated fetch
          resolve();
          // setErrorCities('Fehler beim Laden der Städtedaten'); reject();
        }, 500);
      });

      try {
          // Fetch cities (simulated) and user locations concurrently
          await Promise.all([
              loadCitiesPromise.finally(() => setLoadingCities(false)), // Ensure city loading state is updated
              fetchOtherUserLocations(user?.id) // Fetch user locations, pass current user ID
          ]);
      } catch (err) {
          // Error handling primarily for cities simulation if it were real
          console.error("Error during initial data load:", err);
          // Error state for users is handled within fetchOtherUserLocations
          if (!errorCities) { // Avoid overwriting specific city error
            setErrorCities('Fehler beim Laden der initialen Kartendaten.');
          }
      }
      // Overall loading state could be handled differently, e.g., combining loadingCities and loadingOtherUsers
    };

    if (user) { // Only fetch data if user is logged in
        loadInitialData();
    } else {
        // Reset state if user logs out
        setLoadingCities(false);
        setLoadingOtherUsers(false);
        setOtherUserLocations([]);
        setErrorCities(null);
        setErrorOtherUsers(null);
    }

  }, [user]); // Re-run effect when user logs in or out

  // --- Filter functions (no changes needed) ---
  const filterByCountry = (country: string | null) => { setFilters(prev => ({ ...prev, country })); };
  const filterByPopulation = (min: number, max: number) => { setFilters(prev => ({ ...prev, population: { min, max } })); };
  const filterBySearch = (term: string | null) => { setFilters(prev => ({ ...prev, search: term })); };
  const filterByDistance = (distance: number | null) => { setFilters(prev => ({ ...prev, distance: distance })); };
  const resetFilters = () => { setFilters({ country: null, population: { min: 0, max: Number.MAX_SAFE_INTEGER }, search: null, distance: null }); };

  // --- City selection and zooming (no changes needed) ---
  const selectCity = (cityId: number | null) => {
    if (cityId === null) { setSelectedCity(null); return; }
    const city = cities.find(city => city.id === cityId) || null;
    setSelectedCity(city);
  };
  const zoomToCity = (cityId: number): [number, number] => {
    const city = cities.find(city => city.id === cityId);
    if (!city) { return [20, 0]; }
    return [city.latitude, city.longitude];
  };
  const getTopCities = (count: number): City[] => {
    return sortCitiesByPopulation(cities).slice(0, count);
  };

  // Update the returned object
  return {
    cities,
    loading: loadingCities, // Use city-specific loading state for general 'loading'
    error: errorCities,     // Use city-specific error state for general 'error'
    selectedCity,
    filteredCities,
    otherUserLocations,     // Add new state
    loadingOtherUsers,      // Add new state
    errorOtherUsers,        // Add new state
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
