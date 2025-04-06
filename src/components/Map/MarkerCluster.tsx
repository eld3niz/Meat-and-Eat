import { useEffect, useMemo, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet'; // Import LatLngTuple
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon';
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon'; // Import blue and red user icons

// Define MarkerDefinition locally (mirroring WorldMap.tsx)
// TODO: Consider moving this to a shared types file (e.g., src/types/index.ts)
interface MarkerDefinition {
  id: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'user';
  name: string;
  userId?: string | null;
  population?: number;
  originalItem: City | MapUser;
}

// Use types from @types/leaflet.markercluster

interface MarkerClusterProps {
  markersData: MarkerDefinition[];
  onItemClick: (item: City | MapUser, event: L.LeafletMouseEvent) => void; // Keep passing the event
  onMarkerMouseOver: (city: City) => void; // City-specific mouseover handler
  onMarkerMouseOut: () => void;
  activeCityId: number | null;
  // onClusterClick prop removed - using default zoom behavior
  userCoordinates: LatLngTuple | null; // Still needed? Maybe remove later if unused.
  currentUserId: string | null; // <-- Add currentUserId prop
}

/**
 * Komponente zur Darstellung der Stadt- und Benutzer-Marker mit Clustering
 */
const MarkerCluster = ({
    markersData, // <-- Destructure new prop
    onItemClick, // <-- Destructure new prop
    onMarkerMouseOver,
    onMarkerMouseOut,
    activeCityId,
    // onClusterClick, // Removed
    userCoordinates, // <-- Destructure userCoordinates
    currentUserId // <-- Destructure currentUserId
}: MarkerClusterProps) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({}); // Keep using string keys for the ref

  // Markercluster options remain the same
  const markerClusterOptions = useMemo(() => ({
    chunkedLoading: true,
    spiderfyOnMaxZoom: false, // <-- Disable spiderfication
    disableClusteringAtZoom: 14,
    maxClusterRadius: 80,
    zoomToBoundsOnClick: true, // Restore default zoom behavior
    removeOutsideVisibleBounds: true,
    animate: window.innerWidth > 768,
    iconCreateFunction: (cluster: L.MarkerCluster) => {
      const childCount = cluster.getChildCount();
      const childMarkers = cluster.getAllChildMarkers();

      // --- Check if any marker in the cluster belongs to the current user ---
      let clusterContainsUser = false;
      if (currentUserId) {
        const childMarkers = cluster.getAllChildMarkers();
        for (const marker of childMarkers) {
          // Check the userId property we attached during marker creation
          if ((marker as any).userId === currentUserId) {
            clusterContainsUser = true;
            break; // Found the user marker, no need to check further
          }
        }
      }

      // Removed check for allUsersSameSpot as per new requirement
      // --- Apply uniform size and conditional color ---
      const sizeClass = 'w-8 h-8 text-xs'; // Uniform size for all clusters
      let clusterColorClass = '';
      if (clusterContainsUser) {
          clusterColorClass = 'bg-red-500 border-red-600'; // Red for user's cluster
      } else {
          clusterColorClass = 'bg-blue-500 border-blue-600'; // Blue for all other clusters
      }

      // Calculate the count to display (exclude user's own marker from count if present)
      const displayCount = clusterContainsUser && childCount > 0 ? childCount - 1 : childCount;

      const sizeValue = parseInt(sizeClass.split(' ')[0].substring(2)) * 4; // w-8 -> 32px calculation remains correct
      // Use displayCount in the HTML span
      const html = `<div class="flex items-center justify-center ${sizeClass} ${clusterColorClass} text-white font-semibold rounded-full border-2 border-white shadow-md"><span>${displayCount}</span></div>`;

      // Removed debug logging

      return L.divIcon({
        html: html,
        className: 'marker-cluster-custom', // Ensure this class doesn't override the background
        iconSize: L.point(sizeValue, sizeValue),
        iconAnchor: L.point(sizeValue / 2, sizeValue / 2)
      });
    }
  // Add userCoordinates to dependency array
  }), [userCoordinates, currentUserId]); // Add currentUserId dependency

  // Initialize the MarkerClusterGroup
  useEffect(() => {
    if (!map) return;
    if (!markerClusterGroupRef.current) {
      markerClusterGroupRef.current = new L.MarkerClusterGroup(markerClusterOptions);
      map.addLayer(markerClusterGroupRef.current);
      const clusterGroup = markerClusterGroupRef.current;
      // clusterGroup.on('clusterclick', onClusterClick); // Removed custom handler attachment
    }
    return () => {
      if (map && markerClusterGroupRef.current) {
        // markerClusterGroupRef.current.off('clusterclick', onClusterClick); // Removed custom handler detachment
        // Use clearLayers() for efficiency before removing the group
        markerClusterGroupRef.current.clearLayers();
        map.removeLayer(markerClusterGroupRef.current);
        markerClusterGroupRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map, markerClusterOptions]); // Removed onClusterClick dependency

  // Update markers based on the pre-processed markersData
  // Clear and re-add markers whenever markersData changes
  useEffect(() => {
    if (!map || !markerClusterGroupRef.current) return;

    const currentMarkerGroup = markerClusterGroupRef.current;

    // --- Clear existing markers ---
    currentMarkerGroup.clearLayers(); // Remove all markers from the group
    markersRef.current = {}; // Reset our internal tracking

    // --- Create and add new markers from markersData ---
    const markersToAdd: L.Marker[] = [];
    markersData.forEach(markerDef => {
      let marker: L.Marker;
      let icon: L.Icon | L.DivIcon;

      // Determine icon based on type and current user status
      if (markerDef.type === 'city') {
        icon = createSvgMarkerIcon(markerDef.population ?? 0); // Use population if available
      } else { // markerDef.type === 'user'
        icon = markerDef.userId === currentUserId ? currentUserIconRed : otherUserIconBlue;
      }

      // Create marker at the provided tile center coordinates
      marker = L.marker([markerDef.latitude, markerDef.longitude], { icon });

      // Attach unified click handler using the original item data
      marker.on('click', (e) => onItemClick(markerDef.originalItem, e)); // Pass event

      // Attach userId for cluster icon logic (important!)
      (marker as any).userId = markerDef.userId;

      // Keep city-specific mouseover/mouseout for now
      if (markerDef.type === 'city') {
        marker.on('mouseover', () => { if (activeCityId === null) onMarkerMouseOver(markerDef.originalItem as City); });
        marker.on('mouseout', onMarkerMouseOut);
      }

      // Bind tooltip using the name from markerDef
      marker.bindTooltip(markerDef.name, { permanent: false, direction: 'top', className: 'custom-tooltip' });

      // Use the unique ID from markerDef for tracking
      markersRef.current[markerDef.id] = marker;
      markersToAdd.push(marker);
    });


    if (markersToAdd.length > 0) {
      if (markerClusterGroupRef.current) {
          markerClusterGroupRef.current.addLayers(markersToAdd);
      }
    }

  // Dependencies: Use markersData and onItemClick
  }, [map, markersData, onItemClick, onMarkerMouseOver, onMarkerMouseOut, activeCityId, userCoordinates, currentUserId]); // Keep other dependencies for now

  return null; // Component only manages the Leaflet layer
};

export default MarkerCluster;
