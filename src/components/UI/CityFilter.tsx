import { useState, useEffect, useMemo } from 'react';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface CityFilterProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  userPosition: [number, number] | null;
  showUserLocation: boolean;
}

/**
 * Komponente für den Städtefilter mit Länder- und Städteauswahl
 */
const CityFilter = ({ cities, onCitySelect, onCountryFilter, userPosition, showUserLocation }: CityFilterProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);
  const [showDirectory, setShowDirectory] = useState<boolean>(false);
  
  // Liste der verfügbaren Länder
  const countries = useMemo(() => {
    const countryMap = new Map<string, number>();
    
    cities.forEach(city => {
      const count = countryMap.get(city.country) || 0;
      countryMap.set(city.country, count + 1);
    });
    
    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [cities]);
  
  // Städte im ausgewählten Land
  const citiesInCountry = useMemo(() => {
    if (!selectedCountry) return cities;
    return cities.filter(city => city.country === selectedCountry);
  }, [selectedCountry, cities]);
  
  // Die 5 nächsten Städte, wenn Standort aktiviert ist
  const nearestCities = useMemo(() => {
    if (!userPosition || !showUserLocation) return [];
    
    // Berechne die Entfernung jeder Stadt zum Benutzerstandort
    const citiesWithDistance = cities.map(city => {
      const lat1 = userPosition[0];
      const lon1 = userPosition[1];
      const lat2 = city.latitude;
      const lon2 = city.longitude;
      
      // Haversine-Formel zur Berechnung der Entfernung zwischen zwei Koordinaten
      const R = 6371; // Erdradius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return { ...city, distance };
    });
    
    // Sortiere nach Entfernung und nimm die ersten 5
    return citiesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [userPosition, showUserLocation, cities]);
  
  // Gefilterte Städte für die Anzeige
  const filteredCities = useMemo(() => {
    // Wenn nächstgelegene Städte angezeigt werden sollen
    if (nearestCities.length > 0 && !selectedCountry) {
      return nearestCities;
    }
    
    // Wenn ein Land ausgewählt ist und spezifische Städte ausgewählt sind
    if (selectedCountry && selectedCities.length > 0) {
      return citiesInCountry.filter(city => selectedCities.includes(city.id));
    }
    
    // Wenn nur ein Land ausgewählt ist, zeige alle Städte dieses Landes
    if (selectedCountry) {
      return citiesInCountry.slice(0, 5); // Nur die ersten 5 anzeigen
    }
    
    // Standardfall: Keine Filterung, kein Standort = leere Liste
    return [];
  }, [selectedCountry, selectedCities, citiesInCountry, nearestCities]);
  
  // Bei Änderung des Landes Filter anwenden
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value === "all" ? null : e.target.value;
    setSelectedCountry(country);
    onCountryFilter(country);
    setSelectedCities([]); // Zurücksetzen der ausgewählten Städte
  };
  
  // Bei Änderung der ausgewählten Städte
  const handleCityChange = (cityId: number) => {
    setSelectedCities(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };
  
  // Bei Klick auf eine Stadt in der Liste
  const handleCityClick = (cityId: number) => {
    onCitySelect(cityId);
  };
  
  // Öffnen des vollständigen Verzeichnisses
  const openDirectory = () => {
    setShowDirectory(true);
  };
  
  // Schließen des Verzeichnisses
  const closeDirectory = () => {
    setShowDirectory(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
      <h2 className="text-lg font-semibold mb-4">Städtefilter</h2>
      
      {/* Länderfilter */}
      <div className="mb-4">
        <label htmlFor="country-filter" className="block text-sm font-medium mb-1">
          Nach Land filtern:
        </label>
        <select 
          id="country-filter"
          className="w-full p-2 border rounded"
          value={selectedCountry || "all"}
          onChange={handleCountryChange}
        >
          <option value="all">Alle Länder</option>
          {countries.map(({ country }) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      
      {/* Städtefilter - nur anzeigen, wenn ein Land ausgewählt ist */}
      {selectedCountry && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Städte auswählen:
          </label>
          <div className="max-h-40 overflow-y-auto border rounded p-2">
            {citiesInCountry.map(city => (
              <div key={city.id} className="flex items-center mb-1">
                <input 
                  type="checkbox"
                  id={`city-${city.id}`}
                  checked={selectedCities.includes(city.id)}
                  onChange={() => handleCityChange(city.id)}
                  className="mr-2"
                />
                <label 
                  htmlFor={`city-${city.id}`}
                  className="text-sm cursor-pointer hover:text-blue-600"
                >
                  {city.name} ({formatPopulation(city.population)})
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Anzeige der gefilterten Marker */}
      {filteredCities.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {nearestCities.length > 0 && !selectedCountry 
                ? "Nächstgelegene Städte:" 
                : "Gefilterte Städte:"}
            </h3>
            {/* Mehr-Link nur anzeigen, wenn wir mehr Städte haben als angezeigt werden */}
            {((selectedCountry && citiesInCountry.length > 5) || 
              (nearestCities.length > 0 && !selectedCountry && cities.length > 5)) && (
              <button 
                onClick={openDirectory}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Alle anzeigen
              </button>
            )}
          </div>
          
          <ul className="space-y-1 border rounded divide-y">
            {filteredCities.map(city => (
              <li 
                key={city.id}
                className="p-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleCityClick(city.id)}
              >
                <div className="font-medium text-sm">{city.name}</div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>{city.country}</span>
                  <span>{formatPopulation(city.population)}</span>
                </div>
                {nearestCities.includes(city) && 'distance' in city && (
                  <div className="text-xs text-blue-600">
                    Entfernung: {Math.round((city as any).distance)} km
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Wenn keine Städte gefiltert sind und kein Standort aktiviert ist */}
      {filteredCities.length === 0 && !nearestCities.length && (
        <div className="text-sm text-gray-500 italic text-center p-2 bg-gray-50 rounded">
          Bitte wählen Sie ein Land oder aktivieren Sie Ihren Standort, um Städte anzuzeigen.
        </div>
      )}
      
      {/* Vollständiges Verzeichnis-Popup */}
      {showDirectory && (
        <MarkerDirectory 
          cities={selectedCountry ? citiesInCountry : cities}
          onClose={closeDirectory}
          onCitySelect={handleCityClick}
        />
      )}
    </div>
  );
};

/**
 * Komponente für das Popup-Verzeichnis aller Marker
 */
interface MarkerDirectoryProps {
  cities: City[];
  onClose: () => void;
  onCitySelect: (cityId: number) => void;
}

const MarkerDirectory = ({ cities, onClose, onCitySelect }: MarkerDirectoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'population' | 'name'>('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Gefilterte und sortierte Städte
  const sortedCities = useMemo(() => {
    let result = [...cities];
    
    // Filtern nach Suchbegriff
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(city => 
        city.name.toLowerCase().includes(term) || 
        city.country.toLowerCase().includes(term)
      );
    }
    
    // Sortieren nach gewählter Spalte
    if (sortBy === 'population') {
      result.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.population - b.population 
          : b.population - a.population;
      });
    } else {
      result.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }
    
    return result;
  }, [cities, searchTerm, sortBy, sortOrder]);
  
  // Wechselt die Sortierreihenfolge
  const toggleSort = (column: 'population' | 'name') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Standard: absteigend
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Städteliste</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Stadt oder Land suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    Stadt
                    {sortBy === 'name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Land
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('population')}
                >
                  <div className="flex items-center justify-end">
                    Bevölkerung
                    {sortBy === 'population' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCities.map(city => (
                <tr 
                  key={city.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    onCitySelect(city.id);
                    onClose();
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{city.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{city.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatPopulation(city.population)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedCities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Städte gefunden.
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CityFilter;
