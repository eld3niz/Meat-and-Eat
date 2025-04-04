import React, { useState, useMemo } from 'react';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser type
import { calculateHaversineDistance } from '../../utils/mapUtils';

interface UserTableProps {
  users: MapUser[];
  userPosition: [number, number] | null; // Current logged-in user's position
}

const UserTable: React.FC<UserTableProps> = ({ users, userPosition }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortBy, setSortBy] = useState<'name' | 'distance'>('distance'); // Default sort
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default sort order (closest first)

  // Calculate distance for a user
  const calculateDistance = (user: MapUser): number | null => {
    if (!userPosition) return null;
    return calculateHaversineDistance(
      userPosition[0], // currentUserLat
      userPosition[1], // currentUserLng
      user.latitude,   // otherUserLat
      user.longitude   // otherUserLng
    );
  };

  // Sort users based on current settings
  const sortedUsers = useMemo(() => {
    const usersWithDistance = users.map(user => ({
      ...user,
      distance: calculateDistance(user)
    }));

    return [...usersWithDistance].sort((a, b) => {
      if (sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (sortBy === 'distance') {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Sort null distances to the end
        if (b.distance === null) return -1;
        // Default sort for distance is ASC (closest first)
        return sortOrder === 'asc'
          ? a.distance - b.distance
          : b.distance - a.distance;
      }

      return 0;
    });
  }, [users, sortBy, sortOrder, userPosition]);

  // Slice for visible users
  const visibleUsers = useMemo(() => {
    return sortedUsers.slice(0, visibleCount);
  }, [sortedUsers, visibleCount]);

  // Toggle sort order
  const toggleSort = (column: 'name' | 'distance') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      // Set default sort order based on column
      setSortOrder(column === 'distance' ? 'asc' : 'desc');
    }
  };

  // Show more users
  const handleShowMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  // Get sort arrow indicator
  const getSortArrow = (column: 'name' | 'distance') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // No users available or visible based on filters
  if (users.length === 0) {
    return null; // Don't render the table if no users match filters
    // Or display a message:
    // return (
    //   <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm mt-4">
    //     <p className="text-center text-gray-500">Keine anderen Benutzer gefunden, die den aktuellen Filterkriterien entsprechen.</p>
    //   </div>
    // );
  }

  return (
    // Add margin-top to separate from CityTable
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm mt-4">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Benutzerliste</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <span>Name</span>
                  {getSortArrow('name') && <span className="ml-1">{getSortArrow('name')}</span>}
                </div>
              </th>
              {/* Removed Distance Header */}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map(user => (
              <tr
                key={user.user_id}
                className="border-b hover:bg-green-50 transition-transform duration-200 hover:scale-[1.01] cursor-default"
              >
                {/* Updated cell to include name, bio, and distance */}
                <td className="py-3 px-4 align-top">
                  <div className="font-medium">{user.name}</div>
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
                  )}
                  {/* Add distance below bio */}
                  {userPosition && (
                    <p className="text-xs text-gray-500 mt-1">
                      {user.distance !== null
                        ? `~ ${Math.round(user.distance)} km entfernt`
                        : 'Entfernung unbekannt'}
                    </p>
                  )}
                </td>
                {/* Removed second td for distance */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More Button */}
      {visibleCount < sortedUsers.length && (
        <div className="mt-4 text-center">
          <button
            onClick={handleShowMore}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
          >
            Mehr anzeigen ({Math.min(20, sortedUsers.length - visibleCount)} weitere von {sortedUsers.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default UserTable;