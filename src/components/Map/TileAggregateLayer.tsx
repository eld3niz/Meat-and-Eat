import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';
import { TileData } from '../../hooks/useMapTilingData'; // Assuming TileData is exported
import { getTileCenterLatLng } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon';
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon';

interface TileAggregateLayerProps {
  tileAggregationData: Map<string, TileData>;
  onItemClick: (item: City | MapUser) => void; // Handler for single items
  onAggregateTileClick: (items: (City | MapUser)[], tileCenter: L.LatLng) => void; // Handler for aggregates
  currentUserId: string | null;
}

const TileAggregateLayer: React.FC<TileAggregateLayerProps> = ({
  tileAggregationData,
  onItemClick,
  onAggregateTileClick,
  currentUserId,
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

      if (items.length === 0) {
        // Should not happen, but handle defensively
        return;
      } else if (items.length === 1) {
        // --- Single Item Tile ---
        const item = items[0];
        let tooltipText = item.name;

        if ('population' in item) { // It's a City
          icon = createSvgMarkerIcon(item.population);
          clickHandler = () => onItemClick(item);
        } else { // It's a MapUser
          icon = item.user_id === currentUserId ? currentUserIconRed : otherUserIconBlue;
          clickHandler = () => onItemClick(item);
          if (item.user_id === currentUserId) {
            tooltipText = "Your Location"; // Override tooltip for current user
          }
        }

        // Check if marker exists and update, otherwise create new
        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(tileCenter);
          marker.setIcon(icon);
          marker.off('click').on('click', clickHandler);
        } else {
          marker = L.marker(tileCenter, { icon: icon });
          marker.on('click', clickHandler);
          layer.addLayer(marker);
        }
        // Add/Update tooltip
        marker.unbindTooltip().bindTooltip(tooltipText, { permanent: false, direction: 'top', className: 'custom-tooltip' });

      } else {
        // --- Aggregate Tile ---
        icon = createAggregateIcon(items.length, containsCurrentUser);
        clickHandler = () => onAggregateTileClick(items, tileCenter);

        // Check if marker exists and update, otherwise create new
        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(tileCenter);
          marker.setIcon(icon);
          marker.off('click').on('click', clickHandler);
        } else {
          marker = L.marker(tileCenter, { icon: icon });
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

  }, [map, tileAggregationData, onItemClick, onAggregateTileClick, currentUserId]); // Dependencies

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