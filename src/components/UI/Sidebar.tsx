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
  // User filter props
  onLocalStatusFilter: (statuses: string[] | null) => void; // Renamed
  onBudgetFilter: (budgets: number[] | null) => void;
  onGenderFilter: (genders: string[] | null) => void;
  onAgeFilter: (min: number, max: number) => void; // <-- Add age filter prop
  currentLocalStatusFilter: string[] | null; // Renamed
  currentBudgetFilter: number[] | null;
  currentGenderFilter: string[] | null;
  currentAgeFilter: { min: number; max: number }; // <-- Add current age filter prop
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
  // Destructure user filter props
  onLocalStatusFilter, // Renamed
  onBudgetFilter,
  onGenderFilter,
  onAgeFilter, // <-- Destructure age filter prop
  currentLocalStatusFilter, // Renamed
  currentBudgetFilter,
  currentGenderFilter,
  currentAgeFilter, // <-- Destructure current age filter prop
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
  // Local state for user filters
  const [selectedLocalStatus, setSelectedLocalStatus] = useState<string[]>(currentLocalStatusFilter ?? []); // Renamed state
  const [selectedBudgets, setSelectedBudgets] = useState<number[]>(currentBudgetFilter ?? []);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(currentGenderFilter ?? []);
  const [ageRange, setAgeRange] = useState<[number, number]>([currentAgeFilter.min, currentAgeFilter.max]); // <-- Add state for age filter
  const [hoveredBudgetLevel, setHoveredBudgetLevel] = useState<number | null>(null); // State for hover effect

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
    // Also clear local state for user filters
    setSelectedLocalStatus([]); // Renamed
    setSelectedBudgets([]);
    setSelectedGenders([]);
    setAgeRange([18, 99]); // <-- Reset age range to default
  }, [onResetFilters]);

  // Removed useEffect that reset distanceRange locally.
  // The filter state is now fully controlled by the parent via currentDistanceFilter prop.
  // Parent component (WorldMap -> useMapData) should handle resetting the filter
  // if userPosition becomes unavailable.
  // Effects to sync local filter state if props change (e.g., on external reset)
  useEffect(() => {
    setSelectedLocalStatus(currentLocalStatusFilter ?? []); // Renamed
  }, [currentLocalStatusFilter]); // Renamed dependency

  useEffect(() => {
    setSelectedBudgets(currentBudgetFilter ?? []);
  }, [currentBudgetFilter]);

  useEffect(() => {
    setSelectedGenders(currentGenderFilter ?? []);
  }, [currentGenderFilter]);

  useEffect(() => {
    setAgeRange([currentAgeFilter.min, currentAgeFilter.max]); // <-- Sync age state with prop
  }, [currentAgeFilter]);


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
  // --- Handlers for user filters ---
  const handleLocalStatusChange = (status: string) => {
    const newSelection = selectedLocalStatus.includes(status) // Renamed state check
      ? selectedLocalStatus.filter(s => s !== status) // Renamed state filter
      : [...selectedLocalStatus, status]; // Renamed state spread
    setSelectedLocalStatus(newSelection); // Renamed state update
    onLocalStatusFilter(newSelection.length > 0 ? newSelection : null); // Renamed prop call
  };

  const handleBudgetChange = (clickedLevel: number) => {
    // Determine the current highest selected level
    const maxSelectedLevel = selectedBudgets.length > 0 ? Math.max(...selectedBudgets) : 0;
    let newSelection: number[] = [];

    // If clicking the currently highest selected level, deselect all
    if (clickedLevel === maxSelectedLevel) {
      newSelection = [];
    } else {
      // Otherwise, select all levels up to the clicked level
      newSelection = Array.from({ length: clickedLevel }, (_, i) => i + 1); // e.g., click 2 -> [1, 2]
    }

    setSelectedBudgets(newSelection);
    onBudgetFilter(newSelection.length > 0 ? newSelection : null);
  };

  // --- Handler for Gender Filter ---
  const handleGenderChange = (gender: string) => {
    const newSelection = selectedGenders.includes(gender)
      ? selectedGenders.filter(g => g !== gender)
      : [...selectedGenders, gender];
    setSelectedGenders(newSelection);
    onGenderFilter(newSelection.length > 0 ? newSelection : null);
  };

  // --- Handler for Age Filter ---
  // Debounce age filter to avoid rapid updates while typing
  const debouncedAgeFilter = useMemo(
    () => debounce((min: number, max: number) => {
      onAgeFilter(min, max);
    }, 300), // 300ms debounce
    [onAgeFilter]
  );

  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return; // Ignore non-numeric input

    let newMin = ageRange[0];
    let newMax = ageRange[1];

    if (type === 'min') {
      newMin = Math.max(18, Math.min(numericValue, ageRange[1])); // Ensure min <= max and >= 18
    } else { // type === 'max'
      newMax = Math.min(99, Math.max(numericValue, ageRange[0])); // Ensure max >= min and <= 99
    }

    setAgeRange([newMin, newMax]);
    debouncedAgeFilter(newMin, newMax); // Call debounced filter function
  };


  const localOptions = ["Local", "Traveller"]; // <-- Removed "Other" as derivedStatus doesn't support it
  const budgetOptions = [
      { level: 1, label: '💰' },
      { level: 2, label: '💰💰' },
      { level: 3, label: '💰💰💰' }
  ];
  const genderOptions = ["Male", "Female", "Divers"]; // <-- Define gender options


  return (
    <div className={`transition-all duration-300 bg-gray-300 shadow-md relative ${isCollapsed ? 'w-12' : 'w-full md:w-96 lg:w-1/4'}`}>
      {/* Toggle-Button remains the same */}
      <button
        onClick={onToggleCollapse} // <-- Use the passed handler
        className="absolute right-0 top-4 transform translate-x-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-md shadow-lg z-[999] transition-colors"
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
        // Apply flex flex-col to the main content container
        <div className="p-4 h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
          {/* Title - Shrink if needed */}
          <h2 className="text-xl font-bold text-blue-800 mb-4 flex-shrink-0">Explorer</h2>

          {loading ? (
            // Loading state - center the spinner, allow it to grow
            <div className="flex-grow flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            // Non-loading state - Main content area that grows
            <div className="flex-grow">
              {/* SearchBar removed as requested */}

              {/* Distance Filter */}
              <div className="mt-4 mb-4"> {/* Reduced margin */}
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
              <div className="px-2 mb-4 space-y-2"> {/* Reduced margin */}
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
              <div className="mt-4 mb-4 border-t border-gray-400 pt-3"> {/* Reduced margin/padding */}
                 <h3 className="font-medium text-sm text-gray-700 mb-3">Filter Users By:</h3> {/* Reduced bottom margin */}

                 {/* Local Status Filter */}
                 <div className="mb-4"> {/* Reduced margin */}
                     <label className="block text-xs font-medium text-gray-600 mb-2">Travel Status</label> {/* Reduced margin */}
                     <div className="flex flex-wrap gap-2">
                         {localOptions.map(status => (
                             <button
                                 key={status}
                                 type="button"
                                 onClick={() => handleLocalStatusChange(status)}
                                 className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                     selectedLocalStatus.includes(status) // Renamed state check
                                         ? 'bg-blue-600 text-white'
                                         : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                 }`}
                             >
                                 {status}
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Budget Filter */}
                 <div className="mb-4"> {/* Reduced margin */}
                     <label className="block text-xs font-medium text-gray-600 mb-2">Budget</label> {/* Reduced margin */}
                     {/* Replaced checkboxes with toggle buttons */}
                     <div className="flex space-x-3">
                         {budgetOptions.map(option => {
                             const isSelected = selectedBudgets.includes(option.level);
                             // Determine if the button should appear selected based on hover
                             const isHoverSelected = hoveredBudgetLevel !== null && option.level <= hoveredBudgetLevel;
                             // Determine the final background/text color based on selection and hover
                             let buttonClass = 'bg-gray-200 text-gray-700'; // Default unselected
                             if (isSelected) {
                                 buttonClass = 'bg-yellow-400 text-gray-800'; // Actually selected
                             } else if (isHoverSelected) {
                                 buttonClass = 'bg-yellow-200 text-gray-600'; // Hover-implied selection
                             }

                             return (
                                 <button
                                     key={option.level}
                                     type="button"
                                     onClick={() => handleBudgetChange(option.level)}
                                     onMouseEnter={() => setHoveredBudgetLevel(option.level)}
                                     onMouseLeave={() => setHoveredBudgetLevel(null)}
                                     className={`px-3 py-2 rounded-md text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${buttonClass} ${!isSelected && !isHoverSelected ? 'hover:bg-gray-300' : ''}`} // Add hover only if not selected/hover-selected
                                     aria-pressed={isSelected} // aria-pressed reflects actual selection
                                 >
                                     {option.label}
                                 </button>
                             );
                         })}
                     </div>
                 </div>

                {/* Gender Filter */}
                <div className="mb-4"> {/* Reduced margin */}
                    <label className="block text-xs font-medium text-gray-600 mb-2">Gender</label> {/* Reduced margin */}
                    <div className="flex flex-wrap gap-2">
                        {genderOptions.map(gender => (
                            <button
                                key={gender}
                                type="button"
                                onClick={() => handleGenderChange(gender)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
                                    selectedGenders.includes(gender)
                                        ? 'bg-pink-600 text-white' // Use pink theme for gender
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {gender}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age Filter */}
                <div className="mb-4"> {/* Reduced margin */}
                  <label className="block text-xs font-medium text-gray-600 mb-2">Age Range</label> {/* Reduced margin */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={ageRange[0]}
                      onChange={(e) => handleAgeChange('min', e.target.value)}
                      className="w-16 p-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Minimum age"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={ageRange[1]}
                      onChange={(e) => handleAgeChange('max', e.target.value)}
                      className="w-16 p-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Maximum age"
                    />
                  </div>
                </div>

              </div>
              {/* --- End User Filters --- */}
            </div> // End flex-grow wrapper for non-loading content
          )}

          {/* Reset Button - Placed after the conditional rendering, inside the main flex container */}
          <div className="mt-auto pt-4 flex-shrink-0"> {/* mt-auto pushes to bottom, pt-4 adds space */}
            <button
              onClick={handleReset}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
