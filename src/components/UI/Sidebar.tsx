import { useEffect, useCallback, useMemo, useState } from 'react'; // Import useState moved
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // <-- Import MapUser type
import SearchBar from './SearchBar';
import CityFilter from './CityFilter'; // Check if CityFilter uses showUserLocation later
import { debounce } from '../../utils/mapUtils'; // Import debounce
import TagInput from './TagInput'; // Import the new TagInput component
import { languageOptions as allLanguageOptions, cuisineOptions as allCuisineOptions } from '../../data/options'; // Import options

interface SidebarProps {
  cities: City[];
  users: MapUser[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  onPopulationFilter: (min: number, max: number) => void;
  onDistanceFilter: (distance: number | null) => void;
  currentDistanceFilter: number | null;
  // --- User Filter Props ---
  onAgeFilter: (min: number, max: number) => void;
  onGenderFilter: (genders: string[] | null) => void;
  onLanguagesFilter: (languages: string[] | null) => void;
  onCuisinesFilter: (cuisines: string[] | null) => void;
  onBudgetFilter: (budgets: number[] | null) => void;
  currentAgeFilter: { min: number; max: number };
  currentGenderFilter: string[] | null;
  currentLanguagesFilter: string[] | null;
  currentCuisinesFilter: string[] | null;
  currentBudgetFilter: number[] | null;
  // --- End User Filter Props ---
  // ---
  onResetFilters: () => void;
  loading: boolean; // Represents city loading, might need combined loading state
  userPosition: [number, number] | null;
  filteredStats: { totalCities: number; visibleCities: number; percentage: number } | null;
  // isCollapsed prop removed
  // onToggleCollapse prop removed
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
  onAgeFilter,
  onGenderFilter,
  onLanguagesFilter,
  onCuisinesFilter,
  onBudgetFilter,
  currentAgeFilter,
  currentGenderFilter,
  currentLanguagesFilter,
  currentCuisinesFilter,
  currentBudgetFilter,
  // ---
  onResetFilters,
  loading, // Consider passing loadingCities and loadingUsers separately if needed
  userPosition,
  filteredStats,
  currentDistanceFilter, // <-- Destructure the new prop
  // isCollapsed destructuring removed
  // onToggleCollapse destructuring removed
  isLocationLoading // <-- Destructure location loading prop
}: SidebarProps) => {
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  // Local state for user filters
  const [ageRange, setAgeRange] = useState<[number, number]>([currentAgeFilter.min, currentAgeFilter.max]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(currentGenderFilter ?? []);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(currentLanguagesFilter ?? []);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(currentCuisinesFilter ?? []);
  const [selectedBudgets, setSelectedBudgets] = useState<number[]>(currentBudgetFilter ?? []);
  const [hoveredBudgetLevel, setHoveredBudgetLevel] = useState<number | null>(null); // For budget hover effect

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
    // Reset local user filter state
    setAgeRange([18, 99]);
    setSelectedGenders([]);
    setSelectedLanguages([]);
    setSelectedCuisines([]);
    setSelectedBudgets([]);
  }, [onResetFilters]);

  // Removed useEffect that reset distanceRange locally.
  // The filter state is now fully controlled by the parent via currentDistanceFilter prop.
  // Parent component (WorldMap -> useMapData) should handle resetting the filter
  // if userPosition becomes unavailable.
  // Effects to sync local user filter state with props
  useEffect(() => {
    setAgeRange([currentAgeFilter.min, currentAgeFilter.max]);
  }, [currentAgeFilter]);

  useEffect(() => {
    setSelectedGenders(currentGenderFilter ?? []);
  }, [currentGenderFilter]);

  useEffect(() => {
    setSelectedLanguages(currentLanguagesFilter ?? []);
  }, [currentLanguagesFilter]);

  useEffect(() => {
    setSelectedCuisines(currentCuisinesFilter ?? []);
  }, [currentCuisinesFilter]);

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
  // --- Handlers for User Filters ---

  // Debounce age filter to avoid rapid updates while typing
  const debouncedAgeFilter = useMemo(
    () => debounce((min: number, max: number) => {
      onAgeFilter(min, max);
    }, 300), // 300ms debounce
    [onAgeFilter]
  );

  const handleAgeChange = (event: React.ChangeEvent<HTMLSelectElement>) => { // Changed event type
    const { name, value } = event.target; // Get name and value from select
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return;

    let newMin = ageRange[0];
    let newMax = ageRange[1];

    if (name === 'minAge') { // Check name attribute
      newMin = Math.max(18, Math.min(numericValue, newMax)); // Ensure min <= max and >= 18
    } else if (name === 'maxAge') { // Check name attribute
      newMax = Math.min(99, Math.max(numericValue, newMin)); // Ensure max >= min and <= 99
    }

    setAgeRange([newMin, newMax]);
    debouncedAgeFilter(newMin, newMax); // Debounced call remains the same
  };

  const handleGenderChange = (gender: string) => {
    const newSelection = selectedGenders.includes(gender)
      ? selectedGenders.filter(g => g !== gender)
      : [...selectedGenders, gender];
    setSelectedGenders(newSelection);
    onGenderFilter(newSelection.length > 0 ? newSelection : null);
  };
 
  // Updated handler for TagInput - receives the full array
  const handleLanguageChange = (newSelection: string[]) => {
    setSelectedLanguages(newSelection);
    onLanguagesFilter(newSelection.length > 0 ? newSelection : null);
  };
 
  // Updated handler for TagInput - receives the full array
  const handleCuisineChange = (newSelection: string[]) => {
    setSelectedCuisines(newSelection);
    onCuisinesFilter(newSelection.length > 0 ? newSelection : null);
  };

  const handleBudgetChange = (clickedLevel: number) => {
    const maxSelectedLevel = selectedBudgets.length > 0 ? Math.max(...selectedBudgets) : 0;
    let newSelection: number[] = [];

    if (clickedLevel === maxSelectedLevel) {
      newSelection = []; // Deselect all if clicking the highest selected
    } else {
      newSelection = Array.from({ length: clickedLevel }, (_, i) => i + 1); // Select up to clicked level
    }

    setSelectedBudgets(newSelection);
    onBudgetFilter(newSelection.length > 0 ? newSelection : null);
  };

  // --- Filter Options ---
  // TODO: Potentially fetch languages/cuisines dynamically or use a more comprehensive list
  const genderOptions = ["Male", "Female", "Divers"];
  // Use imported options
  const languageOptions = allLanguageOptions;
  const cuisineOptions = allCuisineOptions;
  const budgetOptions = [
      { level: 1, label: '💰' },
      { level: 2, label: '💰💰' },
      { level: 3, label: '💰💰💰' }
  ];
  // Generate age options for dropdowns
  const ageOptions = Array.from({ length: 99 - 18 + 1 }, (_, i) => 18 + i); // Generates [18, 19, ..., 99]

  // Helper function for button styling
  const getButtonClass = (isSelected: boolean, baseColor: string = 'blue') => {
      return `px-2 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${baseColor}-500 ${
          isSelected
              ? `bg-${baseColor}-600 text-white`
              : `bg-gray-200 text-gray-700 hover:bg-gray-300`
      }`;
  };


  return ( // Added opening parenthesis
    // Removed comment that might have caused parsing issues
    <div className="transition-all duration-300 bg-gray-300 shadow-md relative w-full md:w-96 lg:w-1/4">

      {/* Inhalt der Seitenleiste */}
      {/* Removed the !isCollapsed condition */}
      {/* Apply flex flex-col to the main content container */}
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
              <div className="mt-3 mb-3 border-t border-gray-400 pt-2">
                 <h3 className="font-medium text-sm text-gray-700 mb-2">Filter Users By:</h3>

                 {/* Age Filter */}
                 <div className="mb-3">
                   <label className="block text-xs font-medium text-gray-600 mb-1">Age Range</label>
                   <div className="flex items-center space-x-2">
                     {/* Minimum Age Dropdown */}
                     <select
                       name="minAge" // Added name
                       value={ageRange[0]}
                       onChange={handleAgeChange} // Use modified handler
                       className="w-1/2 p-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
                       aria-label="Minimum age"
                     >
                       {ageOptions.map(age => (
                         <option key={`min-${age}`} value={age}>{age}</option>
                       ))}
                     </select>

                     <span className="text-gray-500 text-xs">-</span>

                     {/* Maximum Age Dropdown */}
                     <select
                       name="maxAge" // Added name
                       value={ageRange[1]}
                       onChange={handleAgeChange} // Use modified handler
                       className="w-1/2 p-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
                       aria-label="Maximum age"
                     >
                       {ageOptions.map(age => (
                         <option key={`max-${age}`} value={age}>{age}</option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {/* Gender Filter */}
                 <div className="mb-3">
                     <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                     <div className="flex flex-wrap gap-1.5">
                         {genderOptions.map(gender => (
                             <button key={gender} type="button" onClick={() => handleGenderChange(gender)}
                                 className={getButtonClass(selectedGenders.includes(gender), 'pink')}>
                                 {gender}
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Budget Filter */}
                 <div className="mb-3">
                     <label className="block text-xs font-medium text-gray-600 mb-1">Budget</label>
                     <div className="flex space-x-2">
                         {budgetOptions.map(option => {
                             const isSelected = selectedBudgets.includes(option.level);
                             const isHoverSelected = hoveredBudgetLevel !== null && option.level <= hoveredBudgetLevel;
                             let buttonClass = 'bg-gray-200 text-gray-700'; // Default
                             if (isSelected) buttonClass = 'bg-yellow-400 text-gray-800'; // Selected
                             else if (isHoverSelected) buttonClass = 'bg-yellow-200 text-gray-600'; // Hover-implied

                             return (
                                 <button
                                     key={option.level} type="button"
                                     onClick={() => handleBudgetChange(option.level)}
                                     onMouseEnter={() => setHoveredBudgetLevel(option.level)}
                                     onMouseLeave={() => setHoveredBudgetLevel(null)}
                                     className={`px-2 py-1 rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-yellow-500 ${buttonClass} ${!isSelected && !isHoverSelected ? 'hover:bg-gray-300' : ''}`}
                                     aria-pressed={isSelected}
                                 >
                                     {option.label}
                                 </button>
                             );
                         })}
                     </div>
                 </div>

                 {/* Languages Filter using TagInput */}
                 <TagInput
                   label="Languages"
                   id="language-filter"
                   options={languageOptions}
                   selectedItems={selectedLanguages}
                   onChange={handleLanguageChange}
                   placeholder="Select language"
                 />

                 {/* Cuisines Filter using TagInput */}
                 <TagInput
                   label="Cuisines"
                   id="cuisine-filter"
                   options={cuisineOptions}
                   selectedItems={selectedCuisines}
                   onChange={handleCuisineChange}
                   placeholder="Select cuisine"
                 />

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
    </div>
  ); // Closing parenthesis for return statement
};

export default Sidebar;
