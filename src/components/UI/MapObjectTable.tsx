import React, { useState, useMemo } from 'react';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation, calculateHaversineDistance } from '../../utils/mapUtils';

// Define combined type
type MapObject = (City & { type: 'city'; distance: number | null }) | (MapUser & { type: 'user'; distance: number | null });

interface MapObjectTableProps { // Renamed interface
  cities: City[];
  users: MapUser[]; // Added users prop
  userPosition: [number, number] | null;
}

// Renamed component
const MapObjectTable: React.FC<MapObjectTableProps> = ({ cities, users, userPosition }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  // Add 'type' to sort options? Maybe not needed if we filter users out for population sort.
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'distance'>('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate distance for any map object (city or user)
  const calculateDistance = (item: City | MapUser): number | null => {
    if (!userPosition) return null;
    // Pass individual coordinate values
    return calculateHaversineDistance(
      userPosition[0], // userLat
      userPosition[1], // userLng
      item.latitude,   // itemLat
      item.longitude   // itemLng
    );
  };

  // Combine and sort cities and users
  const sortedItems = useMemo(() => {
    // Combine cities and users, adding type and distance
    const combinedList: MapObject[] = [
      ...cities.map(city => ({ ...city, type: 'city' as const, distance: calculateDistance(city) })),
      ...users.map(user => ({ ...user, type: 'user' as const, distance: calculateDistance(user) }))
    ];

    // Filter out users if sorting by population
    const listToSort = sortBy === 'population'
        ? combinedList.filter(item => item.type === 'city')
        : combinedList;


    return [...listToSort].sort((a, b) => {
      // Sort by Name (City name or User name)
      if (sortBy === 'name') {
        const nameA = a.type === 'city' ? a.name : a.name; // Both have 'name'
        const nameB = b.type === 'city' ? b.name : b.name;
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Sort by Population (Only applies to cities, users are pre-filtered out)
      if (sortBy === 'population') {
         // We know a and b are cities here because of pre-filtering
         const popA = (a as City & { type: 'city' }).population;
         const popB = (b as City & { type: 'city' }).population;
         return sortOrder === 'asc' ? popA - popB : popB - popA;
      }

      // Sort by Distance
      if (sortBy === 'distance') {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Sort null distances to the end
        if (b.distance === null) return -1;
        return sortOrder === 'asc'
          ? a.distance - b.distance
          : b.distance - a.distance;
      }

      return 0;
    });
  }, [cities, users, sortBy, sortOrder, userPosition]); // Added users dependency

  // Slice for visible items
  const visibleItems = useMemo(() => {
    return sortedItems.slice(0, visibleCount);
  }, [sortedItems, visibleCount]);

  // Toggle sort order
  const toggleSort = (column: 'name' | 'population' | 'distance') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      // Default to desc for population/distance, asc for name? Let's keep desc default.
      setSortOrder('desc');
    }
  };

  // Show more items
  const handleShowMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  // Get sort arrow indicator
  const getSortArrow = (column: 'name' | 'population' | 'distance') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // No items available (check combined length)
  if (cities.length === 0 && users.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Keine Städte oder Benutzer gefunden, die den aktuellen Filterkriterien entsprechen.</p>
      </div>
    );
  }

  // Determine if population sort is active (to disable the header click)
  const isPopulationSortActive = sortBy === 'population';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
      {/* Changed Title */}
      <h2 className="text-2xl font-bold text-blue-800 mb-4">Gefilterte Liste</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              {/* Name Column (City or User) */}
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <span>Name</span>
                  {getSortArrow('name') && <span className="ml-1">{getSortArrow('name')}</span>}
                </div>
              </th>
              {/* Type Column */}
               <th className="py-3 px-4 text-left">Typ</th>
              {/* Country Column (Only for Cities) */}
              <th className="py-3 px-4 text-left">Land</th>
              {/* Population Column (Only for Cities) */}
              <th
                onClick={() => toggleSort('population')} // Keep toggle logic
                className={`py-3 px-4 text-right transition-colors ${isPopulationSortActive ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default text-gray-400'}`} // Style differently if disabled?
                title={isPopulationSortActive ? "Nach Bevölkerung sortieren" : "Bevölkerung (nur Städte)"}
              >
                <div className="flex items-center justify-end">
                  <span>Bevölkerung</span>
                  {getSortArrow('population') && <span className="ml-1">{getSortArrow('population')}</span>}
                </div>
              </th>
              {/* Distance Column (If userPosition exists) */}
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
            {visibleItems.map(item => (
              <tr
                key={item.type === 'city' ? `city-${item.id}` : `user-${item.user_id}`} // Unique key
                className="border-b hover:bg-blue-50 transition-transform duration-200 hover:scale-[1.01] cursor-default"
              >
                {/* Name */}
                <td className="py-3 px-4 font-medium">{item.name}</td>
                 {/* Type */}
                 <td className="py-3 px-4 text-xs">
                    {item.type === 'city'
                        ? <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Stadt</span>
                        : <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Benutzer</span>
                    }
                 </td>
                {/* Country */}
                <td className="py-3 px-4">{item.type === 'city' ? item.country : '—'}</td>
                {/* Population */}
                <td className="py-3 px-4 text-right">{item.type === 'city' ? formatPopulation(item.population) : '—'}</td>
                {/* Distance */}
                {userPosition && (
                  <td className="py-3 px-4 text-right">
                    {item.distance !== null
                      ? `${Math.round(item.distance)} km`
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More Button */}
      {visibleCount < sortedItems.length && (
        <div className="mt-4 text-center">
          <button
            onClick={handleShowMore}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
          >
            Mehr anzeigen ({Math.min(20, sortedItems.length - visibleCount)} weitere von {sortedItems.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default MapObjectTable; // Export renamed component