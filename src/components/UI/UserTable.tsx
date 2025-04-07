import React, { useState, useMemo } from 'react';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser type
import { calculateHaversineDistance } from '../../utils/mapUtils';

interface UserTableProps {
  users: MapUser[];
  userPosition: [number, number] | null; // Current logged-in user's position
  isLoading: boolean; // Add loading state prop
}

const UserTable: React.FC<UserTableProps> = ({ users, userPosition, isLoading }) => { // Destructure isLoading
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

      // Note: Sorting by distance is less relevant now, but kept for name sorting
      if (sortBy === 'distance') {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
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

  // Removed the early return null for empty users

  // Define column widths (adjust percentages as needed)
  const nameWidth = '30%';
  const bioWidth = '40%';
  const budgetWidth = '15%';
  const distanceWidth = '15%';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 bg-white rounded-lg shadow-sm mt-4">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Benutzerliste</h2>

      {/* Added h-full to allow table to expand vertically */}
      <div className="overflow-x-auto h-full">
        {/* Using table-fixed helps align columns based on header widths */}
        {/* Added h-full to allow table to expand vertically */}
        <table className="min-w-full bg-white table-fixed h-full">
          <colgroup>{/* Define column widths */}<col style={{ width: nameWidth }} /><col style={{ width: bioWidth }} /><col style={{ width: budgetWidth }} /><col style={{ width: distanceWidth }} /></colgroup>
          <thead className="bg-gray-100 border-b">
            <tr>
              {/* Header Cells - Apply widths and text alignment */}
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                 Name {getSortArrow('name') && <span className="ml-1">{getSortArrow('name')}</span>}
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entfernung</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading State Row
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Lade Benutzer...
                </td>
              </tr>
            ) : users.length === 0 ? (
              // Empty State Row
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  Keine Benutzer in der Nähe gefunden, die den Filtern entsprechen.
                </td>
              </tr>
            ) : (
              // Data Rows
              visibleUsers.map(user => (
                <tr
                  key={user.user_id}
                  className="border-b hover:bg-green-50 transition-colors duration-150"
                >
                  {/* Data Cells - Apply consistent alignment and padding */}
                  <td className="py-3 px-4 text-left align-middle"> {/* Added align-middle */}
                    <span className="font-bold truncate">{user.name}</span>
                  </td>
                  <td className="py-3 px-4 text-center align-middle"> {/* Added align-middle */}
                    <span className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap block"> {/* Use block for ellipsis */}
                      {user.bio || ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center align-middle"> {/* Added align-middle */}
                    <span className="text-lg">
                      {user.budget ? '💰'.repeat(user.budget) : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right align-middle"> {/* Added align-middle */}
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                      {userPosition
                        ? (user.distance !== null ? `~ ${Math.round(user.distance)} km` : 'N/A')
                        : 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show More Button */}
      {/* Show More Button - Only show if not loading and there are more users than currently visible */}
      {!isLoading && visibleCount < sortedUsers.length && (
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