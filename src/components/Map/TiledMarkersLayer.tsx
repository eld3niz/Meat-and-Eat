import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData';
import { TileData } from '../../hooks/useMapTilingData';
import { getTileCenterLatLng } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon'; // Assuming this is the correct path
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon'; // Assuming this is the correct path

interface TiledMarkersLayerProps {
  tileAggregationData: Map<string, TileData>;
  onSingleCityTileClick: (city: City, marker: L.Marker) => void;
  onSingleUserTileClick: (user: MapUser, marker: L.Marker) => void;
  onAggregateTileClick: (tileId: string, items: (City | MapUser)[], tileCenter: L.LatLng, marker: L.Marker) => void;
  currentUserId: string | null;
}

const TiledMarkersLayer: React.FC<TiledMarkersLayerProps> = ({
  tileAggregationData,
  onSingleCityTileClick,
  onSingleUserTileClick,
  onAggregateTileClick,
  currentUserId,
}) => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [tileId: string]: L.Marker }>({}); // Keep track of markers by tileId

  // Function to create the aggregate marker icon
  const createAggregateIcon = (count: number, containsCurrentUser: boolean): L.DivIcon => {
    const sizeClass = 'w-8 h-8 text-xs'; // Consistent size like clusters
    const clusterColorClass = containsCurrentUser
      ? 'bg-red-500 border-red-600' // Red if current user is in the tile
      : 'bg-blue-500 border-blue-600'; // Blue otherwise
    const sizeValue = 32; // Corresponds to w-8/h-8 in pixels

    // Adjust display count to match cluster behavior (subtract 1 if user is present)
    const displayCount = containsCurrentUser && count > 0 ? count - 1 : count;

    const html = `<div class="flex items-center justify-center ${sizeClass} ${clusterColorClass} text-white font-bold rounded-full border-2 border-white shadow-md"><span>${displayCount}</span></div>`;

    return L.divIcon({
      html: html,
      className: 'marker-aggregate-custom', // Custom class for potential styling
      iconSize: L.point(sizeValue, sizeValue),
      iconAnchor: L.point(sizeValue / 2, sizeValue / 2), // Center anchor
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
      const tileCenter = getTileCenterLatLng(tileId);
      const { items, containsCurrentUser } = tileData;
      let marker: L.Marker;

      if (items.length === 1) {
        // --- Single Item Tile ---
        const item = items[0];
        let icon: L.Icon | L.DivIcon;
        let clickHandler: (markerInstance: L.Marker) => void;

        if ('population' in item) { // It's a City
          icon = createSvgMarkerIcon(item.population);
          clickHandler = (m) => onSingleCityTileClick(item, m);
        } else { // It's a MapUser
          icon = item.user_id === currentUserId ? currentUserIconRed : otherUserIconBlue;
          clickHandler = (m) => onSingleUserTileClick(item, m);
        }

        // Check if marker exists and update, otherwise create new
        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(tileCenter); // Update position (might not change often)
          marker.setIcon(icon); // Update icon if needed
          // Re-bind click handler in case props changed
          marker.off('click').on('click', () => clickHandler(marker));
        } else {
          marker = L.marker(tileCenter, { icon: icon });
          marker.on('click', () => clickHandler(marker));
          layer.addLayer(marker);
        }
        // Add tooltip
        marker.bindTooltip(item.name, { permanent: false, direction: 'top', className: 'custom-tooltip' });

      } else if (items.length > 1) {
        // --- Aggregate Tile ---
        const aggregateIcon = createAggregateIcon(items.length, containsCurrentUser);
        const clickHandler = (m: L.Marker) => onAggregateTileClick(tileId, items, tileCenter, m);

        // Check if marker exists and update, otherwise create new
        if (currentMarkers[tileId]) {
          marker = currentMarkers[tileId];
          marker.setLatLng(tileCenter);
          marker.setIcon(aggregateIcon);
          // Re-bind click handler
          marker.off('click').on('click', () => clickHandler(marker));
        } else {
          marker = L.marker(tileCenter, { icon: aggregateIcon });
          marker.on('click', () => clickHandler(marker));
          layer.addLayer(marker);
        }
        // No tooltip for aggregate markers? Or maybe "X items"?
        // marker.bindTooltip(`${items.length} items`);
      } else {
        // Should not happen if aggregation is correct, but handle defensively
        return;
      }

      newMarkers[tileId] = marker; // Track the marker
      delete currentMarkers[tileId]; // Remove from old markers list
    });

    // Remove markers that are no longer in the data
    Object.values(currentMarkers).forEach(marker => layer.removeLayer(marker));
    markersRef.current = newMarkers; // Update the ref

  }, [map, tileAggregationData, onSingleCityTileClick, onSingleUserTileClick, onAggregateTileClick, currentUserId]); // Dependencies

  // Cleanup effect to remove the layer group when the component unmounts
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map]);

  return null; // This component only manages Leaflet layers
};

export default TiledMarkersLayer;