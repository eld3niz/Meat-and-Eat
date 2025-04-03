import React, { useState, useMemo } from 'react';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation, calculateHaversineDistance } from '../../utils/mapUtils';

// Define combined type
// Only users are map objects now
type MapObject = MapUser & { type: 'user'; distance: number | null };

interface MapObjectTableProps { // Renamed interface
  cities: City[];
  users: MapUser[]; // Added users prop
  userPosition: [number, number] | null;
}

// Renamed component
const MapObjectTable: React.FC<MapObjectTableProps> = ({ cities, users, userPosition }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  // Add 'type' to sort options? Maybe not needed if we filter users out for population sort.
  // Removed 'population' sort option
  const [sortBy, setSortBy] = useState<'name' | 'distance'>('distance'); // Default to distance?
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
    // Only use users, map them to MapObject type
    const listToSort: MapObject[] = users.map(user => ({
      ...user,
      type: 'user' as const,
      distance: calculateDistance(user)
    }));


    return [...listToSort].sort((a, b) => {
      // Sort by Name (City name or User name)
      // Sort by Name (User name)
      if (sortBy === 'name') {
        const nameA = a.name;
        const nameB = b.name;
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Sort by Population removed

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
  }, [users, sortBy, sortOrder, userPosition]); // Removed cities dependency

  // Slice for visible items
  const visibleItems = useMemo(() => {
    return sortedItems.slice(0, visibleCount);
  }, [sortedItems, visibleCount]);

  // Toggle sort order
  // Removed 'population' from column type
  const toggleSort = (column: 'name' | 'distance') => {
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
  // Removed 'population' from column type
  const getSortArrow = (column: 'name' | 'distance') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // No items available (check combined length)
  // Check only users length
  if (users.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Keine Benutzer gefunden, die den aktuellen Filterkriterien entsprechen.</p>
      </div>
    );
  }

  // Removed population sort check
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm">
      {/* Changed Title */}
      {/* Changed Title */}
      <h2 className="text-2xl font-bold text-blue-800 mb-4">Benutzerliste</h2>

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
              {/* Type Column - Kept for clarity */}
              <th className="py-3 px-4 text-left">Typ</th>
             {/* Country Column Removed */}
             {/* Population Column Removed */}
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
                key={`user-${item.user_id}`} // Simpler key, only users now
                className="border-b hover:bg-blue-50 transition-transform duration-200 hover:scale-[1.01] cursor-default"
              >
                {/* Name */}
                <td className="py-3 px-4 font-medium">{item.name}</td>
                 {/* Type */}
                 <td className="py-3 px-4 text-xs">
                    {/* Always Benutzer now */}
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Benutzer</span>
                 </td>
                {/* Country Column Removed */}
                {/* Population Column Removed */}
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