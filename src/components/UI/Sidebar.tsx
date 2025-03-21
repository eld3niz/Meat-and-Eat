import { useState, useEffect, useCallback } from 'react';
import CityStats from './CityStats';
import { City } from '../../types';
import SearchBar from './SearchBar';

interface SidebarProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  onPopulationFilter: (min: number, max: number) => void;
  onDistanceFilter: (distance: number | null) => void; // Neue Prop für Entfernungsfilter
  onResetFilters: () => void;
  loading: boolean;
  onToggleUserLocation: () => void;
  showUserLocation: boolean;
  userPosition: [number, number] | null; // Benutzerstandort-Prop hinzugefügt
}

/**
 * Seitenleiste mit Filteroptionen und Statistiken
 */
const Sidebar = ({ 
  cities, 
  onCitySelect, 
  onCountryFilter, 
  onPopulationFilter,
  onDistanceFilter, // Neuer Parameter
  onResetFilters,
  loading,
  onToggleUserLocation,
  showUserLocation,
  userPosition // Neuer Parameter
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [populationRange, setPopulationRange] = useState<[number, number]>([0, 40000000]);
  const [distanceRange, setDistanceRange] = useState<number>(200); // Neuer State für Entfernungsfilter
  
  // Zustand, um zu überprüfen, ob der Slider aktiviert sein soll
  const isDistanceFilterEnabled = showUserLocation && userPosition !== null;
  
  const handlePopulationChange = (range: [number, number]) => {
    setPopulationRange(range);
    onPopulationFilter(range[0], range[1]);
  };
  
  // Optimierter Handler für Entfernungsfilter mit useCallback
  const handleDistanceChange = useCallback((distance: number) => {
    setDistanceRange(distance);
    // 200 = "Alle", jeder andere Wert begrenzt die Entfernung
    onDistanceFilter(distance >= 200 ? null : distance);
  }, [onDistanceFilter]);
  
  const handleReset = useCallback(() => {
    setPopulationRange([0, 40000000]);
    setDistanceRange(200);
    onResetFilters();
  }, [onResetFilters]);
  
  // Entfernungsfilter zurücksetzen, wenn Benutzerstandort deaktiviert wird
  useEffect(() => {
    if (!isDistanceFilterEnabled && distanceRange < 200) {
      setDistanceRange(200);
      onDistanceFilter(null);
    }
  }, [isDistanceFilterEnabled, distanceRange, onDistanceFilter]);
  
  return (
    <div className={`transition-all duration-300 bg-white shadow-md relative ${isCollapsed ? 'w-12' : 'w-full md:w-96 lg:w-1/4'}`}>
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
              
              {/* Standort-Button */}
              <div className="mt-4 mb-4">
                <button 
                  onClick={onToggleUserLocation}
                  className={`w-full py-2 px-4 rounded transition-colors flex items-center justify-center ${
                    showUserLocation 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {showUserLocation ? 'Standort ausblenden' : 'Meinen Standort anzeigen'}
                </button>
              </div>
              
              {/* Verbesserte Entfernungsfilter-Komponente */}
              <div className="mt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-medium text-sm ${isDistanceFilterEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    Entfernungsfilter:
                  </h3>
                  {isDistanceFilterEnabled && (
                    <span className="text-xs text-blue-600 font-medium">
                      {distanceRange < 200 ? `${distanceRange} km` : "Alle"}
                    </span>
                  )}
                </div>
                
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={distanceRange}
                    onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                    className={`w-full ${isDistanceFilterEnabled 
                      ? 'cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isDistanceFilterEnabled}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0 km</span>
                    <span>Alle</span>
                  </div>
                  
                  {!showUserLocation && (
                    <div className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded">
                      <p className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Aktivieren Sie Ihren Standort, um diesen Filter zu nutzen.
                      </p>
                    </div>
                  )}
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
