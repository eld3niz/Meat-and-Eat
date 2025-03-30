import { useState, useEffect, useCallback } from 'react';
import { City } from '../../types';
import SearchBar from './SearchBar';
import CityFilter from './CityFilter'; // Check if CityFilter uses showUserLocation later

interface SidebarProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  onPopulationFilter: (min: number, max: number) => void;
  onDistanceFilter: (distance: number | null) => void;
  onResetFilters: () => void;
  loading: boolean;
  // Removed: onToggleUserLocation: () => void;
  // Removed: showUserLocation: boolean;
  userPosition: [number, number] | null;
  filteredStats: { totalCities: number; visibleCities: number; percentage: number } | null;
}

/**
 * Seitenleiste mit Filteroptionen und Statistiken
 */
const Sidebar = ({
  cities,
  onCitySelect,
  onCountryFilter,
  onPopulationFilter,
  onDistanceFilter,
  onResetFilters,
  loading,
  // Removed: onToggleUserLocation,
  // Removed: showUserLocation,
  userPosition,
  filteredStats
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  const [distanceRange, setDistanceRange] = useState<number>(500);

  // Distance filter is enabled only if we have a user position
  const isDistanceFilterEnabled = userPosition !== null;

  const handlePopulationChange = (range: [number, number]) => {
    setPopulationRange(range);
    onPopulationFilter(range[0], range[1]);
  };

  const handleDistanceChange = useCallback((distance: number) => {
    setDistanceRange(distance);
    onDistanceFilter(distance >= 500 ? null : distance);
  }, [onDistanceFilter]);

  const handleReset = useCallback(() => {
    setPopulationRange([0, 40000000]);
    setDistanceRange(500);
    onResetFilters();
  }, [onResetFilters]);

  // Reset distance filter UI if user position becomes unavailable (e.g., error during session)
  useEffect(() => {
    if (!isDistanceFilterEnabled && distanceRange < 500) {
      setDistanceRange(500);
      // No need to call onDistanceFilter(null) here as the parent component
      // should handle filtering based on the actual userPosition state.
    }
  }, [isDistanceFilterEnabled, distanceRange]);

  // Slider color depends only on whether the filter is enabled (user position available)
  const getSliderColor = useCallback(() => {
    if (!isDistanceFilterEnabled) return 'bg-gray-300';
    // Color logic based on range remains the same
    if (distanceRange < 50) return 'bg-red-500';
    if (distanceRange < 100) return 'bg-yellow-500';
    if (distanceRange < 200) return 'bg-blue-500';
    return 'bg-green-500';
  }, [isDistanceFilterEnabled, distanceRange]);

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
          <h2 className="text-xl font-bold text-blue-800 mb-4">Städte Explorer</h2>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <SearchBar cities={cities} onCitySelect={onCitySelect} />

              {/* REMOVED Standort-Button Section */}

              {/* Verbesserte Entfernungsfilter-Komponente */}
              <div className="mt-6 mb-6"> {/* Adjusted margin */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-medium text-sm ${isDistanceFilterEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    Entfernungsfilter:
                  </h3>
                  {isDistanceFilterEnabled && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      distanceRange < 500 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {distanceRange < 500 ? `${distanceRange} km` : "Alle"}
                    </span>
                  )}
                </div>

                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={distanceRange}
                    onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                    className={`w-full ${isDistanceFilterEnabled
                      ? 'cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isDistanceFilterEnabled}
                    style={{ accentColor: getSliderColor() }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0 km</span>
                    <span>Alle</span>
                  </div>

                  {/* Statistik über gefilterte Städte */}
                  {filteredStats && distanceRange < 500 && (
                    <div className="mt-2 text-xs bg-blue-50 p-2 rounded flex items-center text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clipRule="evenodd" /></svg>
                      <span>
                        {filteredStats.visibleCities} von {filteredStats.totalCities} Städten ({filteredStats.percentage}%) sichtbar
                      </span>
                    </div>
                  )}

                  {/* REMOVED Message about activating location */}
                </div>
              </div>

              {/* Bevölkerungsfilter */}
              <div className="mt-4 mb-6">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Bevölkerungsfilter:</h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="40000000"
                    step="1000000"
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

              <div className="mb-4">
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
                >
                  Filter zurücksetzen
                </button>
              </div>

              {/* CityFilter - Check if showUserLocation prop is needed */}
              <CityFilter
                cities={cities}
                onCitySelect={onCitySelect}
                onCountryFilter={onCountryFilter}
                userPosition={userPosition}
                // Removed: showUserLocation={showUserLocation}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
