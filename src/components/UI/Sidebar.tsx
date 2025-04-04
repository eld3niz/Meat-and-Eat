import { useEffect, useCallback, useMemo, useState } from 'react'; // Import useState moved
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
  currentDistanceFilter: number | null; // <-- Add prop for current filter value
  // New user filter props
  onLocalFilter: (statuses: string[] | null) => void;
  onBudgetFilter: (budgets: number[] | null) => void;
  currentLocalFilter: string[] | null;
  currentBudgetFilter: number[] | null;
  // ---
  onResetFilters: () => void;
  loading: boolean; // Represents city loading, might need combined loading state
  userPosition: [number, number] | null;
  filteredStats: { totalCities: number; visibleCities: number; percentage: number } | null;
  isCollapsed: boolean; // <-- Add prop for collapsed state
  onToggleCollapse: () => void; // <-- Add prop for toggling collapse
  isLocationLoading: boolean; // <-- Add prop for location loading status
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
  // Destructure new filter props
  onLocalFilter,
  onBudgetFilter,
  currentLocalFilter,
  currentBudgetFilter,
  // ---
  onResetFilters,
  loading, // Consider passing loadingCities and loadingUsers separately if needed
  userPosition,
  filteredStats,
  currentDistanceFilter, // <-- Destructure the new prop
  isCollapsed, // <-- Destructure new prop
  onToggleCollapse, // <-- Destructure new prop
  isLocationLoading // <-- Destructure location loading prop
}: SidebarProps) => {
  // Removed internal isCollapsed state
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  // Local state for new user filters
  const [selectedLocalStatuses, setSelectedLocalStatuses] = useState<string[]>(currentLocalFilter ?? []);
  const [selectedBudgets, setSelectedBudgets] = useState<number[]>(currentBudgetFilter ?? []);

  // Default distance is 50km (representing "All")
  // Removed distanceRange state, now controlled by currentDistanceFilter prop

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
    }, 40), // Debounce time: Further reduced to 40ms for maximum responsiveness
    [onDistanceFilter] // Recreate if the original callback changes
  );

  const handleDistanceChange = useCallback((distance: number) => {
    // Directly call the debounced filter function passed via props
    // If distance is 50 or more, pass null (meaning "All")
    debouncedDistanceFilter(distance >= 50 ? null : distance);
  }, [debouncedDistanceFilter]); // Depend on the debounced function

  const handleReset = useCallback(() => {
    setPopulationRange([0, 40000000]);
    // setDistanceRange(50); // No longer needed, parent state handles reset
    onResetFilters(); // This should trigger parent state update (which clears useMapData state)
    // Also clear local state for new filters
    setSelectedLocalStatuses([]);
    setSelectedBudgets([]);
  }, [onResetFilters]);

  // Removed useEffect that reset distanceRange locally.
  // The filter state is now fully controlled by the parent via currentDistanceFilter prop.
  // Parent component (WorldMap -> useMapData) should handle resetting the filter
  // if userPosition becomes unavailable.
  // Effect to sync local filter state if props change (e.g., on external reset)
  useEffect(() => {
    setSelectedLocalStatuses(currentLocalFilter ?? []);
  }, [currentLocalFilter]);

  useEffect(() => {
    setSelectedBudgets(currentBudgetFilter ?? []);
  }, [currentBudgetFilter]);


  // Slider color depends only on whether the filter is enabled (user position available)
  const getSliderColor = useCallback(() => {
    if (!isDistanceFilterEnabled) return 'bg-gray-300';
    // Use currentDistanceFilter prop for color logic
    // Treat null (All) as the green state (>= 40 effectively)
    const value = currentDistanceFilter; // Can be null
    if (value === null || value >= 40) return 'bg-green-500'; // Green for 40+ or "All"
    if (value < 10) return 'bg-red-500';
    if (value < 25) return 'bg-yellow-500';
    // If value is not null and >= 25 but < 40
    return 'bg-blue-500';
  }, [isDistanceFilterEnabled, currentDistanceFilter]); // Depend on prop

  // Determine if users should be shown based on length (they are pre-filtered in useMapData)
  const showUsers = users.length > 0;
  // --- Handlers for new user filters ---
  const handleLocalStatusChange = (status: string) => {
    const newSelection = selectedLocalStatuses.includes(status)
      ? selectedLocalStatuses.filter(s => s !== status)
      : [...selectedLocalStatuses, status];
    setSelectedLocalStatuses(newSelection);
    onLocalFilter(newSelection.length > 0 ? newSelection : null); // Pass null if empty
  };

  const handleBudgetChange = (budgetLevel: number) => {
    const newSelection = selectedBudgets.includes(budgetLevel)
      ? selectedBudgets.filter(b => b !== budgetLevel)
      : [...selectedBudgets, budgetLevel];
    setSelectedBudgets(newSelection);
    onBudgetFilter(newSelection.length > 0 ? newSelection : null); // Pass null if empty
  };

  const localOptions = ["Local", "Expat", "Tourist", "Other"];
  const budgetOptions = [
      { level: 1, label: '💰' },
      { level: 2, label: '💰💰' },
      { level: 3, label: '💰💰💰' }
  ];


  return (
    <div className={`transition-all duration-300 bg-gray-300 shadow-md relative ${isCollapsed ? 'w-12' : 'w-full md:w-96 lg:w-1/4'}`}>
      {/* Toggle-Button remains the same */}
      <button
        onClick={onToggleCollapse} // <-- Use the passed handler
        className="absolute right-0 top-4 transform translate-x-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-md shadow-lg z-[1100] transition-colors"
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
                      currentDistanceFilter !== null ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' // Check for null instead of < 50
                    }`}>
                      {currentDistanceFilter !== null ? `${currentDistanceFilter} km` : "Alle"} {/* Display prop value */}
                    </span>
                  )}
                </div>
                {/* --- Conditional Rendering: Loading Indicator or Slider --- */}
                {isLocationLoading ? (
                  <div className="px-2 py-4 flex items-center justify-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span>Finding location...</span>
                  </div>
                ) : (
                  <div className="px-2">
                    <input
                      type="range" min="1" max="50" step="1" // Changed range and step
                      value={currentDistanceFilter ?? 50} // Use prop, map null to 50 for slider max
                      onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                      className={`w-full ${isDistanceFilterEnabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      disabled={!isDistanceFilterEnabled}
                      style={{ accentColor: getSliderColor() }}
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>1 km</span>
                      <span>Alle</span>
                    </div>
                  </div>
                )}
                {/* --- End Conditional Rendering --- */}
              </div> {/* End of main distance filter container div */}

              {/* Statistics Section (Moved outside filter container) */}
              <div className="px-2 mb-6 space-y-2"> {/* Container for stats with padding and spacing */}
                {/* City Statistics Removed */}
                {/* User Statistics */}
                {users && currentDistanceFilter !== null && (
                  <div className="text-xs bg-blue-50 p-2 rounded flex items-center text-blue-700 w-full"> {/* Added w-full */}
                    {/* Optional: Add an icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11a6 6 0 011 11.91V19h-1v-1a5 5 0 01-2.07-9.29A6.97 6.97 0 0013 16c0 .34.024.673.07 1h-1.94a6.97 6.97 0 00-.88-2.83A5 5 0 017 11a6 6 0 011-11.91V1H7v1a5 5 0 01-2.07 9.29A6.97 6.97 0 005 16c0 .34.024.673.07 1H4a1 1 0 00-1 1v3a1 1 0 001 1h12a1 1 0 001-1v-3a1 1 0 00-1-1h-1.07z" /></svg>
                    <span>
                      {users.length} Menschen in deiner Gegend wollen Gesellschaft
                    </span>
                  </div>
                )}
              </div> {/* End of statistics container div */}

              {/* --- User Filters --- */}
              <div className="mt-6 mb-6 border-t border-gray-400 pt-4">
                 <h3 className="font-medium text-sm text-gray-700 mb-3">Filter Users By:</h3>

                 {/* Local Status Filter */}
                 <div className="mb-4">
                     <label className="block text-xs font-medium text-gray-600 mb-2">Local Status</label>
                     <div className="space-y-2">
                         {localOptions.map(status => (
                             <label key={status} className="flex items-center text-sm">
                                 <input
                                     type="checkbox"
                                     className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                     checked={selectedLocalStatuses.includes(status)}
                                     onChange={() => handleLocalStatusChange(status)}
                                 />
                                 <span className="ml-2 text-gray-700">{status}</span>
                             </label>
                         ))}
                     </div>
                 </div>

                 {/* Budget Filter */}
                 <div className="mb-4">
                     <label className="block text-xs font-medium text-gray-600 mb-2">Budget</label>
                     <div className="space-y-2">
                         {budgetOptions.map(option => (
                             <label key={option.level} className="flex items-center text-sm">
                                 <input
                                     type="checkbox"
                                     className="form-checkbox h-4 w-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400" // Adjusted color
                                     checked={selectedBudgets.includes(option.level)}
                                     onChange={() => handleBudgetChange(option.level)}
                                 />
                                 <span className="ml-2 text-gray-700">{option.label}</span>
                             </label>
                         ))}
                     </div>
                 </div>
              </div>
              {/* --- End User Filters --- */}

              {/* Reset Button */}
              <div className="mb-4">
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>


            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
