import React, { useState, useMemo } from 'react';
import { City } from '../../types';
import { formatPopulation, calculateHaversineDistance } from '../../utils/mapUtils';

interface CityTableProps {
  cities: City[];
  userPosition: [number, number] | null;
}

const CityTable: React.FC<CityTableProps> = ({ cities, userPosition }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'distance'>('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Berechnet die Entfernung zur Benutzerposition
  const calculateDistance = (city: City): number | null => {
    if (!userPosition) return null;
    
    return calculateHaversineDistance(
      { latitude: userPosition[0], longitude: userPosition[1] },
      { latitude: city.latitude, longitude: city.longitude }
    );
  };

  // Sortierte Städte basierend auf den aktuellen Sortiereinstellungen
  const sortedCities = useMemo(() => {
    const citiesWithDistance = cities.map(city => ({
      ...city,
      distance: calculateDistance(city)
    }));

    return [...citiesWithDistance].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      
      if (sortBy === 'population') {
        return sortOrder === 'asc' 
          ? a.population - b.population 
          : b.population - a.population;
      }
      
      if (sortBy === 'distance') {
        // Wenn keine Entfernung vorhanden ist, diese Städte nach hinten sortieren
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        
        return sortOrder === 'asc'
          ? a.distance - b.distance
          : b.distance - a.distance;
      }
      
      return 0;
    });
  }, [cities, sortBy, sortOrder, userPosition]);

  // Sichtbare Städte basierend auf visibleCount
  const visibleCities = useMemo(() => {
    return sortedCities.slice(0, visibleCount);
  }, [sortedCities, visibleCount]);

  // Umschalten der Sortierreihenfolge
  const toggleSort = (column: 'name' | 'population' | 'distance') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Mehr Städte anzeigen
  const handleShowMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  // Anzeigen eines Sortierpfeils basierend auf der aktuellen Sortierung
  const getSortArrow = (column: 'name' | 'population' | 'distance') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Keine Städte verfügbar
  if (cities.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Keine Städte gefunden, die den aktuellen Filterkriterien entsprechen.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">Städteliste</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th 
                onClick={() => toggleSort('name')}
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <span>Stadt</span>
                  {getSortArrow('name') && <span className="ml-1">{getSortArrow('name')}</span>}
                </div>
              </th>
              <th className="py-3 px-4 text-left">Land</th>
              <th 
                onClick={() => toggleSort('population')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Bevölkerung</span>
                  {getSortArrow('population') && <span className="ml-1">{getSortArrow('population')}</span>}
                </div>
              </th>
              {userPosition && (
                <th 
                  onClick={() => toggleSort('distance')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    <span>Entfernung</span>
                    {getSortArrow('distance') && <span className="ml-1">{getSortArrow('distance')}</span>}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleCities.map(city => (
              <tr 
                key={city.id} 
                className="border-b hover:bg-blue-50 transition-transform duration-200 hover:scale-[1.01] cursor-default"
              >
                <td className="py-3 px-4 font-medium">{city.name}</td>
                <td className="py-3 px-4">{city.country}</td>
                <td className="py-3 px-4 text-right">{formatPopulation(city.population)}</td>
                {userPosition && (
                  <td className="py-3 px-4 text-right">
                    {city.distance !== null 
                      ? `${Math.round(city.distance)} km` 
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {visibleCount < sortedCities.length && (
        <div className="mt-4 text-center">
          <button 
            onClick={handleShowMore}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Mehr anzeigen ({Math.min(20, sortedCities.length - visibleCount)} weitere von {sortedCities.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CityTable;
