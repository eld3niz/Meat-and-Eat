import { useEffect, useMemo, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet'; // Import LatLngTuple
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon'; // Restore original import
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon'; // Restore original import
import { MarkerDefinition } from '../../utils/mapIconUtils'; // Keep MarkerDefinition import
// MarkerDefinition is now imported from mapIconUtils
// import { createSingleMarkerClusterIcon } from '../../utils/mapIconUtils'; // Comment out unused import


interface MarkerClusterProps {
  markersData: MarkerDefinition[];
  onItemClick: (item: City | MapUser, position?: L.LatLng, event?: L.LeafletMouseEvent) => void;
  activeCityId: number | null;
  currentUserId: string | null;
  userCoordinates: [number, number] | null;
}

/**
 * Komponente zur Darstellung der Stadt- und Benutzer-Marker mit Clustering
 */
const MarkerCluster = ({
    markersData,
    onItemClick,
    activeCityId,
    userCoordinates,
    currentUserId
}: MarkerClusterProps) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({}); // Keep using string keys for the ref

  // Markercluster options remain the same
  const markerClusterOptions = useMemo(() => ({
    chunkedLoading: true,
    spiderfyOnMaxZoom: false,
    singleMarkerMode: true, // <-- Add this line
    maxClusterRadius: 80, // Adjust as needed
    zoomToBoundsOnClick: true, // Restore default zoom behavior
    removeOutsideVisibleBounds: true,
    animate: window.innerWidth > 768,
    iconCreateFunction: (cluster: L.MarkerCluster) => {
      const childCount = cluster.getChildCount();
      const childMarkers = cluster.getAllChildMarkers();

      // --- START: Handle single marker case ---
      if (childCount === 1) {
        // If there's only one marker, return its original icon
        const singleMarker = childMarkers[0];
        // Ensure the marker and its options/icon exist before returning
        if (singleMarker && singleMarker.options && singleMarker.options.icon) {
            // We need to return the icon itself, not create a new one.
            // The library handles using the original marker's icon when singleMarkerMode is true.
            // However, to force it here if singleMarkerMode isn't working as expected,
            // we might need a different approach or ensure singleMarkerMode is truly active.
            // For now, let's assume singleMarkerMode *should* work and this function
            // should ideally not be called for count=1. If it IS called, returning
            // the original icon *might* work depending on internal library details,
            // but the standard way is relying on singleMarkerMode.
            // The explicit return below handles the case where singleMarkerMode doesn't prevent this function call.
            // Removed console.warn as the behavior is now understood and handled.
            return singleMarker.options.icon;
        }
        // Fallback if icon somehow isn't found (shouldn't happen)
        // Create a minimal default icon or handle error appropriately
        console.error("Could not retrieve original icon for single marker cluster.");
        // Return a default divIcon or handle error
         return L.divIcon({ html: '?', className: 'leaflet-marker-icon', iconSize: [20, 20] });
      }
      // --- END: Handle single marker case ---


      // --- Logic for multi-item clusters (childCount > 1) ---
      const sizeClass = 'w-8 h-8 text-xs'; // Uniform size
      const sizeValue = 32; // w-8 -> 32px
      let html = '';
      let clusterColorClass = '';

      let clusterContainsUser = false;

      // --- Always style as a cluster ---
      if (currentUserId) {
        for (const marker of childMarkers) {
          if ((marker as any).userId === currentUserId) {
            clusterContainsUser = true;
            break;
          }
        }
      }

      if (clusterContainsUser) {
          clusterColorClass = 'bg-red-500 border-red-600'; // Red for user's cluster
      } else {
          clusterColorClass = 'bg-blue-500 border-blue-600'; // Blue for other clusters
      }

      // Calculate the count to display
      // If the cluster contains the current user, decide if you want to show count-1 or the full count
      // For now, let's show the full count always for simplicity when always clustering
      const displayCount = childCount; // Always show the total count in the cluster

      // Use displayCount in the HTML span
      html = `<div class="flex items-center justify-center ${sizeClass} ${clusterColorClass} text-white font-semibold rounded-full border-2 border-white shadow-md"><span>${displayCount}</span></div>`;

      // Removed debug logging

      // This divIcon creation is now only for multi-item clusters (childCount > 1)
      return L.divIcon({
        html: html, // html is only set in the else block now
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

      // --- Create icon mimicking cluster style for single markers (Commented out) ---
      // Use the helper function to generate a divIcon styled like a cluster
      // const iconOptions = createSingleMarkerClusterIcon(markerDef, currentUserId);
      // icon = L.divIcon(iconOptions);

      // --- Original Icon Logic (Restored) ---
      if (markerDef.type === 'city') {
        icon = createSvgMarkerIcon(markerDef.population ?? 0);
      } else { // markerDef.type === 'user'
        icon = markerDef.userId === currentUserId ? currentUserIconRed : otherUserIconBlue;
      }

      // Create marker at the provided tile center coordinates
      marker = L.marker([markerDef.latitude, markerDef.longitude], { icon });

      // Attach unified click handler using the original item data
      marker.on('click', (e) => onItemClick(markerDef.originalItem, e.latlng, e)); // Pass item, position, and event

      // Attach userId for cluster icon logic (important!)
      // Attach data needed by iconCreateFunction for single-item clusters
      (marker as any).userId = markerDef.userId;
      (marker as any).markerType = markerDef.type;
      if (markerDef.type === 'city') {
        (marker as any).population = markerDef.population ?? 0;
      }

      // Bind tooltip using the name from markerDef - REMOVED
      // marker.bindTooltip(markerDef.name, { permanent: false, direction: 'top', className: 'custom-tooltip' });

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
  }, [map, markersData, onItemClick, activeCityId, userCoordinates, currentUserId]); // Keep other dependencies for now

  return null; // Component only manages the Leaflet layer
};

export default MarkerCluster;
