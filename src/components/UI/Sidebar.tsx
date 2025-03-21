import { useState } from 'react';
import CityStats from './CityStats';
import { City } from '../../types';
import SearchBar from './SearchBar';

interface SidebarProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  onPopulationFilter: (min: number, max: number) => void;
  onResetFilters: () => void;
  loading: boolean;
}

/**
 * Seitenleiste mit Filteroptionen und Statistiken
 */
const Sidebar = ({ 
  cities, 
  onCitySelect, 
  onCountryFilter, 
  onPopulationFilter,
  onResetFilters,
  loading 
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  
  const handlePopulationChange = (range: [number, number]) => {
    setPopulationRange(range);
    onPopulationFilter(range[0], range[1]);
  };
  
  const handleReset = () => {
    setPopulationRange([0, 40000000]);
    onResetFilters();
  };
  
  return (
    <div className={`transition-all duration-300 bg-white shadow-md relative ${isCollapsed ? 'w-12' : 'w-full md:w-80'}`}>
      {/* Toggle-Button für Mobilgeräte */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-4 transform translate-x-6 bg-blue-600 text-white p-2 rounded-r-md shadow-md z-10 md:hidden"
        aria-label={isCollapsed ? "Seitenleiste anzeigen" : "Seitenleiste ausblenden"}
      >
        {isCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
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
              
              <CityStats 
                cities={cities} 
                onCitySelect={onCitySelect} 
                onCountryFilter={onCountryFilter} 
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
