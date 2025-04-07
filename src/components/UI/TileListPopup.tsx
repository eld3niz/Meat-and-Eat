import React from 'react';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';

interface TileListPopupProps {
  items: (City | MapUser)[];
  onClose?: () => void;
}

const TileListPopup: React.FC<TileListPopupProps> = ({ items, onClose }) => {
  // Filter out only user items (we're only interested in users for this popup)
  const userItems = items.filter((item): item is MapUser => 'user_id' in item);
  
  // Format budget to display as emoji
  const formatBudget = (budget: number | null | undefined) => {
    if (!budget) return '—';
    return '💰'.repeat(budget);
  };

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
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userItems.map((user) => (
                <tr key={user.user_id} className="hover:bg-blue-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatBudget(user.budget)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.is_local === 'Local' ? 'bg-green-100 text-green-800' : 
                        user.is_local === 'Expat' ? 'bg-blue-100 text-blue-800' : 
                        user.is_local === 'Tourist' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {user.is_local || 'Other'}
                    </span>
                  </td>
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
    </div>
  );
};

export default TileListPopup;