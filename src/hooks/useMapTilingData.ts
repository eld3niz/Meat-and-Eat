import { useMemo } from 'react';
import { City } from '../types';
import { MapUser } from './useMapData'; // Assuming MapUser is exported from useMapData
import { getTileId } from '../utils/mapUtils';

export interface TileData {
  items: (City | MapUser)[];
  containsCurrentUser: boolean;
}

/**
 * Custom hook to aggregate city and user data into map tiles based on zoom level 14.
 *
 * @param cities Array of City objects.
 * @param users Array of MapUser objects.
 * @param currentUserId The ID of the currently logged-in user, or null.
 * @param isEnabled Boolean indicating if tiling logic should be active (typically zoom >= 14).
 * @returns A Map where keys are tile IDs (string) and values are TileData objects.
 */
export const useMapTilingData = (
  cities: City[],
  users: MapUser[],
  currentUserId: string | null,
  isEnabled: boolean
): Map<string, TileData> => {

  const tileAggregationData = useMemo(() => {
    // If tiling is not enabled (e.g., zoom < 14), return an empty map.
    if (!isEnabled) {
      return new Map<string, TileData>();
    }

    const aggregation = new Map<string, TileData>();

    // Combine cities and users into a single list with type information
    const allItems: (City | MapUser)[] = [...cities, ...users];

    allItems.forEach(item => {
      // Ensure item has latitude and longitude before processing
      if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
        console.warn('Item missing coordinates, skipping:', item);
        return; // Skip items without valid coordinates
      }

      const tileId = getTileId(item.latitude, item.longitude);

      if (!aggregation.has(tileId)) {
        aggregation.set(tileId, { items: [], containsCurrentUser: false });
      }

      const tileData = aggregation.get(tileId)!; // We know it exists due to the check above

      // Add the item to the tile's list
      tileData.items.push(item);

      // Check if the current item is the logged-in user
      // Need to differentiate between City and MapUser type for the ID check
      const isCurrentUserItem = 'user_id' in item && item.user_id === currentUserId;

      if (isCurrentUserItem) {
        tileData.containsCurrentUser = true;
      }
    });

    return aggregation;

  // Dependencies: Recalculate only when input data or enabled status changes.
  }, [cities, users, currentUserId, isEnabled]);

  return tileAggregationData;
};