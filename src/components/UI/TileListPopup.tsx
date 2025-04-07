import React, { useState } from 'react';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';
import ReadOnlyUserProfile from '../Profile/ReadOnlyUserProfile';

interface TileListPopupProps {
  items: (City | MapUser)[];
  onClose?: () => void;
  onUserClick: (userId: string) => void;
}

const TileListPopup: React.FC<TileListPopupProps> = ({ items, onClose, onUserClick }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filter out only user items (we're only interested in users for this popup)
  const userItems = items.filter((item): item is MapUser => 'user_id' in item);

  // Handler for user row click
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    if (onUserClick) {
      onUserClick(userId);
    }
  };

  // Reset selected user when profile is closed
  const handleCloseProfile = () => {
    setSelectedUserId(null);
  };

  return (
    <div className="tile-list-popup-container p-4 max-w-2xl bg-white rounded-lg shadow-lg">
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
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleUserClick(user.user_id)}
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
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
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

      {selectedUserId && (
        <ReadOnlyUserProfile 
          userId={selectedUserId}
          onClose={handleCloseProfile}
        />
      )}
    </div>
  );
};

export default TileListPopup;