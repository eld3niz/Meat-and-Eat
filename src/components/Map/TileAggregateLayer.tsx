import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';
import { TileData } from '../../hooks/useMapTilingData';
// Import necessary utils
import { getTileCenterLatLng, calculateHaversineDistance, calculateBorderPoint } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon'; // Restore original import
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon'; // Restore original import
// import { createSingleMarkerClusterIcon, MarkerDefinition } from '../../utils/mapIconUtils'; // Comment out unused import
import { MarkerDefinition } from '../../utils/mapIconUtils'; // Keep MarkerDefinition import

interface TileAggregateLayerProps {
  tileAggregationData: Map<string, TileData>;
  onItemClick: (item: City | MapUser, position?: L.LatLng, event?: L.LeafletMouseEvent) => void; // Allow event object
  onAggregateTileClick: (items: (City | MapUser)[], position: L.LatLng) => void; // Update to accept position
  currentUserId: string | null;
  currentUserLocation: L.LatLng | null;
  distanceRadius: number | null;
}

const TileAggregateLayer: React.FC<TileAggregateLayerProps> = ({
  tileAggregationData,
  onItemClick,
  onAggregateTileClick,
  currentUserId,
  currentUserLocation, // <-- Destructure prop
  distanceRadius, // <-- Destructure prop
}) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [tileId: string]: L.Marker }>({}); // Keep track of markers by tileId

  // Function to create the aggregate marker icon (similar to TiledMarkersLayer/MarkerCluster)
  const createAggregateIcon = (count: number, containsCurrentUser: boolean): L.DivIcon => {
    const sizeClass = 'w-8 h-8 text-xs'; // Consistent size
    const clusterColorClass = containsCurrentUser
      ? 'bg-red-500 border-red-600' // Red if current user is in the tile
      : 'bg-blue-500 border-blue-600'; // Blue otherwise
    const sizeValue = 32; // Corresponds to w-8/h-8

    // Adjust display count (exclude user's own marker if present)
    const displayCount = containsCurrentUser && count > 0 ? count - 1 : count;

    const html = `<div class="flex items-center justify-center ${sizeClass} ${clusterColorClass} text-white font-bold rounded-full border-2 border-white shadow-md"><span>${displayCount}</span></div>`;

    return L.divIcon({
      html: html,
      className: 'marker-aggregate-custom',
      iconSize: L.point(sizeValue, sizeValue),
      iconAnchor: L.point(sizeValue / 2, sizeValue / 2),
    });
  };

  // Effect to add/update markers when data changes
  useEffect(() => {
    // Initialize layer group if it doesn't exist
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const layer = layerRef.current;
    const currentMarkers = markersRef.current;
    const newMarkers: { [tileId: string]: L.Marker } = {};

    // Iterate through new data to add/update markers
    tileAggregationData.forEach((tileData, tileId) => {
      let tileCenter: L.LatLng;
      try {
        tileCenter = getTileCenterLatLng(tileId);
      } catch (error) {
        console.error(`Error getting tile center for ${tileId}:`, error);
        return; // Skip this tile if center calculation fails
      }

      const { items, containsCurrentUser } = tileData;
      let marker: L.Marker;
      let icon: L.Icon | L.DivIcon;
      let clickHandler: () => void;
      let finalPosition = tileCenter; // Default position is the tile center

      // --- Start of New Logic ---
      if (currentUserLocation && distanceRadius !== null && items.length > 0) {
        // Check if any item in the tile is *actually* within the radius
        const isAnyItemInsideRadius = items.some(item => {
          const itemLatLng = L.latLng(item.latitude, item.longitude);
          const distanceToItem = calculateHaversineDistance(
            currentUserLocation.lat, currentUserLocation.lng,
            itemLatLng.lat, itemLatLng.lng
          );
          return distanceToItem <= distanceRadius;
        });

        if (isAnyItemInsideRadius) {
          // At least one item is within the radius. Now check the tile center's distance.
          const distanceToTileCenter = calculateHaversineDistance(
            currentUserLocation.lat, currentUserLocation.lng,
            tileCenter.lat, tileCenter.lng
          );

          if (distanceToTileCenter > distanceRadius) {
            // An item is inside, but the tile center is outside. Adjust position to border.
            finalPosition = calculateBorderPoint(currentUserLocation, tileCenter, distanceRadius);
          }
          // else: An item is inside, and the tile center is also inside. Use original tileCenter (finalPosition).
        }
        // else: No items in this tile are within the radius. Use original tileCenter (finalPosition).
      }
      // --- End of New Logic ---


      if (items.length === 0) {
        // Should not happen, but handle defensively
        return;
      } else if (items.length === 1) {
        // --- Single Item Tile ---
        const item = items[0];
        // Tooltips are removed

        // Create a MarkerDefinition object to pass to the shared icon function
        const markerDef: MarkerDefinition = {
          id: 'population' in item ? `city-${item.id}` : `user-${item.user_id}`, // Create a unique ID
          latitude: item.latitude,
          longitude: item.longitude,
          type: 'population' in item ? 'city' : 'user',
          name: item.name,
          userId: 'population' in item ? null : item.user_id,
          population: 'population' in item ? item.population : undefined,
          originalItem: item,
        };

        // --- Use Original Icon Logic ---
        if (markerDef.type === 'city') {
          icon = createSvgMarkerIcon(markerDef.population ?? 0);
        } else { // markerDef.type === 'user'
          icon = markerDef.userId === currentUserId ? currentUserIconRed : otherUserIconBlue;
        }

        // Click handler is now defined inline below when attaching to marker
        // Check if marker exists and update, otherwise create new
        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(finalPosition); // <-- Use finalPosition
          marker.setIcon(icon);
          // Define handler inline to avoid type conflict and pass event
          marker.off('click').on('click', (e: L.LeafletMouseEvent) => {
              onItemClick(item, finalPosition, e);
              // Temporarily removed stopPropagation for debugging
              // L.DomEvent.stopPropagation(e);
          });
        } else {
          marker = L.marker(finalPosition, { icon: icon }); // <-- Use finalPosition
          // Define handler inline for new markers
          marker.on('click', (e: L.LeafletMouseEvent) => {
              onItemClick(item, finalPosition, e);
              // Temporarily removed stopPropagation for debugging
              // L.DomEvent.stopPropagation(e);
          });
          layer.addLayer(marker);
        // Removed duplicate else block from previous incorrect diff application
        }
        // Popup is handled by onItemClick (handleItemClick in WorldMap)
      } else {
        // --- Aggregate Tile ---
        icon = createAggregateIcon(items.length, containsCurrentUser);
        // Pass the marker's actual position to the click handler for context
        clickHandler = () => onAggregateTileClick(items, finalPosition); // Use finalPosition instead of tileCenter

        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(finalPosition); // <-- Use finalPosition
          marker.setIcon(icon);
          marker.off('click').on('click', clickHandler);
        } else {
          marker = L.marker(finalPosition, { icon: icon }); // <-- Use finalPosition
          marker.on('click', clickHandler);
          layer.addLayer(marker);
        }
        // Optional: Tooltip for aggregate markers
        // marker.unbindTooltip().bindTooltip(`${items.length} items`, { permanent: false, direction: 'top' });
        marker.unbindTooltip(); // Remove tooltip for aggregate markers
      }

      newMarkers[tileId] = marker; // Track the marker
      delete currentMarkers[tileId]; // Remove from old markers list
    });

    // Remove markers that are no longer in the data
    Object.values(currentMarkers).forEach(marker => layer.removeLayer(marker));
    markersRef.current = newMarkers; // Update the ref

  }, [map, tileAggregationData, onItemClick, onAggregateTileClick, currentUserId, currentUserLocation, distanceRadius]); // <-- Add dependencies

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map]);

  return null; // Component only manages Leaflet layers
};

export default TileAggregateLayer;