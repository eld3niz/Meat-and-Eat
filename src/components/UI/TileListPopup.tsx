import React from 'react'; // Removed useState import
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';
// Removed ReadOnlyUserProfile import

interface TileListPopupProps {
  items: (City | MapUser)[];
  onClose?: () => void;
  onUserClick: (userId: string) => void; // Add new prop for handling user clicks
}

const TileListPopup: React.FC<TileListPopupProps> = ({ items, onClose, onUserClick }) => { // Add onUserClick to props
  // Removed viewingUserId state

  // Filter out only user items (we're only interested in users for this popup)
  const userItems = items.filter((item): item is MapUser => 'user_id' in item);
  
  return (
    <div className="tile-list-popup-container p-4 max-w-2xl bg-white rounded-lg shadow-lg"> {/* Removed popup-open-anim */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-bold text-blue-800">Benutzer in dieser Gegend</h3>
      </div>

      {userItems.length > 0 ? (
        <div className="overflow-y-auto max-h-60">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userItems.map((user) => (
                <tr
                  key={user.user_id}
                  className="hover:bg-blue-50 cursor-pointer" // Add cursor-pointer
                  // onClick moved to the name cell below
                >
                  <td className="px-1 py-1 whitespace-nowrap">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={`${user.name}'s avatar`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {user.name ? user.name.substring(0, 2).toUpperCase() : '?'}
                      </div>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900"
                    onClick={() => onUserClick(user.user_id)} // Call the passed prop instead of setting local state
                  >
                    {user.name || 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{user.age ?? 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-3 text-center text-gray-500">
          Keine Benutzer in diesem Cluster gefunden.
        </div>
      )}
      {/* Removed rendering of ReadOnlyUserProfile */}
    </div>
  );
};

export default TileListPopup;