import { useState, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // <-- Import MapUser type
import SearchBar from './SearchBar';
import CityFilter from './CityFilter'; // Check if CityFilter uses showUserLocation later
import { debounce } from '../../utils/mapUtils'; // Import debounce

interface SidebarProps {
  cities: City[];
  users: MapUser[]; // <-- Add users prop
  onCitySelect: (cityId: number) => void;
  // onUserSelect: (userId: string) => void; // TODO: Add if user selection is needed
  onCountryFilter: (country: string | null) => void;
  onPopulationFilter: (min: number, max: number) => void;
  onDistanceFilter: (distance: number | null) => void;
  onResetFilters: () => void;
  loading: boolean; // Represents city loading, might need combined loading state
  userPosition: [number, number] | null;
  filteredStats: { totalCities: number; visibleCities: number; percentage: number } | null;
}

/**
 * Seitenleiste mit Filteroptionen und Listen (Städte & Benutzer)
 */
const Sidebar = ({
  cities,
  users, // <-- Destructure users
  onCitySelect,
  // onUserSelect, // TODO: Destructure if added
  onCountryFilter,
  onPopulationFilter,
  onDistanceFilter,
  onResetFilters,
  loading, // Consider passing loadingCities and loadingUsers separately if needed
  userPosition,
  filteredStats
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  // Default distance is 50km (representing "All")
  const [distanceRange, setDistanceRange] = useState<number>(50);

  // Distance filter is enabled only if we have a user position
  const isDistanceFilterEnabled = userPosition !== null;

  const handlePopulationChange = (range: [number, number]) => {
    setPopulationRange(range);
    onPopulationFilter(range[0], range[1]);
  };

  // Debounce the distance filter function to avoid rapid map updates
  const debouncedDistanceFilter = useMemo(
    () => debounce((distance: number | null) => {
      onDistanceFilter(distance);
    }, 300), // Debounce time: 300ms
    [onDistanceFilter] // Recreate if the original callback changes
  );

  const handleDistanceChange = useCallback((distance: number) => {
    setDistanceRange(distance); // Update local state immediately for slider UI feedback
    // If distance is 50 or more, pass null (meaning "All") to the filter function
    debouncedDistanceFilter(distance >= 50 ? null : distance); // Call debounced filter function
  }, [debouncedDistanceFilter]); // Depend on the debounced function

  const handleReset = useCallback(() => {
    setPopulationRange([0, 40000000]);
    setDistanceRange(50); // Reset to 50km ("All")
    onResetFilters();
  }, [onResetFilters]);

  // Reset distance filter UI if user position becomes unavailable (e.g., error during session)
  useEffect(() => {
    // If distance filter becomes disabled and it wasn't set to "All", reset it to "All" (50)
    if (!isDistanceFilterEnabled && distanceRange < 50) {
      setDistanceRange(50);
      // No need to call onDistanceFilter(null) here as the parent component
      // should handle filtering based on the actual userPosition state.
    }
  }, [isDistanceFilterEnabled]); // Only depend on enablement status

  // Slider color depends only on whether the filter is enabled (user position available)
  const getSliderColor = useCallback(() => {
    if (!isDistanceFilterEnabled) return 'bg-gray-300';
    // Color logic based on range remains the same
    // Adjust color thresholds for the new 0-50 range
    if (distanceRange < 10) return 'bg-red-500';
    if (distanceRange < 25) return 'bg-yellow-500';
    if (distanceRange < 40) return 'bg-blue-500';
    return 'bg-green-500'; // Green for 40-50 ("All")
  }, [isDistanceFilterEnabled, distanceRange]);

  // Determine if users should be shown based on length (they are pre-filtered in useMapData)
  const showUsers = users.length > 0;

  return (
    <div className={`transition-all duration-300 bg-white shadow-md relative ${isCollapsed ? 'w-12' : 'w-full md:w-96 lg:w-1/4'}`}>
      {/* Toggle-Button remains the same */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-4 transform translate-x-6 bg-blue-600 text-white p-2 rounded-r-md shadow-md z-10 md:hidden"
        aria-label={isCollapsed ? "Seitenleiste anzeigen" : "Seitenleiste ausblenden"}
      >
        {isCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        )}
      </button>

      {/* Inhalt der Seitenleiste */}
      {!isCollapsed && (
        <div className="p-4 h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Explorer</h2> {/* Changed Title */}

          {loading ? ( // Use combined loading state?
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Search applies to both cities and users now (handled in useMapData) */}
              <SearchBar cities={cities} onCitySelect={onCitySelect} />

              {/* Distance Filter */}
              <div className="mt-6 mb-6"> {/* Adjusted margin */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-medium text-sm ${isDistanceFilterEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    Entfernungsfilter:
                  </h3>
                  {isDistanceFilterEnabled && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      distanceRange < 50 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {distanceRange < 50 ? `${distanceRange} km` : "Alle"}
                    </span>
                  )}
                </div>
                <div className="px-2">
                  <input
                    type="range" min="1" max="50" step="1" // Changed range and step
                    value={distanceRange}
                    onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                    className={`w-full ${isDistanceFilterEnabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isDistanceFilterEnabled}
                    style={{ accentColor: getSliderColor() }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>1 km</span>
                    <span>Alle</span>
                  </div>
                  {/* Statistics (currently only for cities) */}
                  {filteredStats && distanceRange < 50 && ( // Update condition
                    <div className="mt-2 text-xs bg-blue-50 p-2 rounded flex items-center text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clipRule="evenodd" /></svg>
                      <span>
                        {filteredStats.visibleCities} von {filteredStats.totalCities} Städten ({filteredStats.percentage}%) sichtbar
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Population Filter (Applies only to cities) */}
              <div className="mt-4 mb-6">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Bevölkerungsfilter (Städte):</h3>
                <div className="px-2">
                  <input
                    type="range" min="0" max="40000000" step="1000000"
                    value={populationRange[1]}
                    onChange={(e) => handlePopulationChange([populationRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0</span>
                    <span>Max: {(populationRange[1] / 1000000).toFixed(0)} Mio.</span>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="mb-4">
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>

              {/* City Filter Component (Displays list of cities) */}
              <CityFilter
                cities={cities} // Pass original cities or filteredCities? Let's pass filteredCities
                onCitySelect={onCitySelect}
                onCountryFilter={onCountryFilter} // Country filter applies only to cities
                userPosition={userPosition}
              />

              {/* --- User List Section --- */}
              {showUsers && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Andere Benutzer:</h3>
                  <ul className="max-h-48 overflow-y-auto text-sm"> {/* Limit height and scroll */}
                    {users.map((user) => (
                      <li
                        key={user.user_id}
                        // TODO: Add onClick handler if user selection is implemented
                        // onClick={() => onUserSelect(user.user_id)}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded" // Basic styling
                      >
                        {user.name} {/* Display user name */}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* --- End User List Section --- */}

            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
