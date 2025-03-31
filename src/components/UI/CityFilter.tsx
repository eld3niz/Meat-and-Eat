import { useState, useEffect, useMemo } from 'react';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface CityFilterProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
  userPosition: [number, number] | null;
  // Removed: showUserLocation: boolean;
}

/**
 * Komponente für den Städtefilter mit Länder- und Städteauswahl
 */
const CityFilter = ({ cities, onCitySelect, onCountryFilter, userPosition }: CityFilterProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<number[]>([]);
  const [showDirectory, setShowDirectory] = useState<boolean>(false);

  // Liste der verfügbaren Länder (No change)
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

  // Städte im ausgewählten Land (No change)
  const citiesInCountry = useMemo(() => {
    if (!selectedCountry) return cities;
    return cities.filter(city => city.country === selectedCountry);
  }, [selectedCountry, cities]);

  // Die 5 nächsten Städte, wenn Standort verfügbar ist (userPosition is not null)
  const nearestCities = useMemo(() => {
    // Only calculate if userPosition is available
    if (!userPosition) return [];

    const [userLat, userLng] = userPosition;

    // Berechne die Entfernung jeder Stadt zum Benutzerstandort
    const citiesWithDistance = cities.map(city => {
      const lat2 = city.latitude;
      const lon2 = city.longitude;

      // Haversine-Formel
      const R = 6371; // km
      const dLat = (lat2 - userLat) * Math.PI / 180;
      const dLon = (lon2 - userLng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return { ...city, distance };
    });

    // Sortiere nach Entfernung und nimm die ersten 5
    return citiesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [userPosition, cities]); // Dependency on showUserLocation removed

  // Gefilterte Städte für die Anzeige (Logic simplified slightly)
  const filteredCities = useMemo(() => {
    // If user position is available and no country is selected, show nearest cities
    if (userPosition && !selectedCountry) {
      return nearestCities;
    }

    // If a country is selected
    if (selectedCountry) {
        // If specific cities are selected within that country, show them
        if (selectedCities.length > 0) {
            return citiesInCountry.filter(city => selectedCities.includes(city.id));
        }
        // Otherwise, show the top 5 cities of the selected country
        return citiesInCountry.slice(0, 5);
    }

    // Default: No country selected, no user position -> show nothing initially
    return [];
  }, [selectedCountry, selectedCities, citiesInCountry, nearestCities, userPosition]);

  // Handlers remain mostly the same
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value === "all" ? null : e.target.value;
    setSelectedCountry(country);
    onCountryFilter(country);
    setSelectedCities([]);
  };

  const handleCityChange = (cityId: number) => {
    setSelectedCities(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };

  const handleCityClick = (cityId: number) => {
    onCitySelect(cityId);
  };

  const openDirectory = () => {
    setShowDirectory(true);
  };

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
              {userPosition && !selectedCountry
                ? "Nächstgelegene Städte:" // Changed logic slightly
                : "Gefilterte Städte:"}
            </h3>
            {/* Logic for showing "Alle anzeigen" button */}
            {((selectedCountry && citiesInCountry.length > 5) ||
              (userPosition && !selectedCountry && cities.length > 5)) && ( // Check if nearest cities could be more than 5
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
                {/* Check if the city is in nearestCities and has distance */}
                {userPosition && 'distance' in city && nearestCities.some(nc => nc.id === city.id) && (
                  <div className="text-xs text-blue-600">
                    Entfernung: {Math.round((city as any).distance)} km
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Wenn keine Städte gefiltert sind */}
      {filteredCities.length === 0 && (
        <div className="text-sm text-gray-500 italic text-center p-2 bg-gray-50 rounded">
            {userPosition ? "Keine Städte im Filter gefunden." : "Bitte wählen Sie ein Land."}
        </div>
      )}

      {/* Vollständiges Verzeichnis-Popup */}
      {showDirectory && (
        <MarkerDirectory
          cities={selectedCountry ? citiesInCountry : cities} // Show all cities if no country selected
          onClose={closeDirectory}
          onCitySelect={handleCityClick}
        />
      )}
    </div>
  );
};

// MarkerDirectory component remains unchanged
interface MarkerDirectoryProps {
  cities: City[];
  onClose: () => void;
  onCitySelect: (cityId: number) => void;
}

const MarkerDirectory = ({ cities, onClose, onCitySelect }: MarkerDirectoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'population' | 'name'>('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedCities = useMemo(() => {
    let result = [...cities];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(city =>
        city.name.toLowerCase().includes(term) ||
        city.country.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'population') {
        return sortOrder === 'asc' ? a.population - b.population : b.population - a.population;
      } else {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    });
    return result;
  }, [cities, searchTerm, sortBy, sortOrder]);

  const toggleSort = (column: 'population' | 'name') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"> {/* Added flex flex-col */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0"> {/* Added flex-shrink-0 */}
          <h2 className="text-lg font-bold">Städteliste</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 border-b flex-shrink-0"> {/* Added flex-shrink-0 */}
          <input
            type="text"
            placeholder="Stadt oder Land suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="overflow-y-auto flex-grow"> {/* Added flex-grow */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10"> {/* Added z-10 */}
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">Stadt{sortBy === 'name' && (<span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>)}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Land</th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('population')}
                >
                  <div className="flex items-center justify-end">Bevölkerung{sortBy === 'population' && (<span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>)}</div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCities.map(city => (
                <tr
                  key={city.id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => { onCitySelect(city.id); onClose(); }}
                >
                  <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900">{city.name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{city.country}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatPopulation(city.population)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedCities.length === 0 && (
            <div className="text-center py-8 text-gray-500">Keine Städte gefunden.</div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-right flex-shrink-0"> {/* Added flex-shrink-0 */}
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Schließen</button>
        </div>
      </div>
    </div>
  );
};

export default CityFilter;
