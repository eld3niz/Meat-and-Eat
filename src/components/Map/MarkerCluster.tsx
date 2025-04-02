import { useEffect, useMemo, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet'; // Import LatLngTuple
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon';
import { otherUserIconBlue, currentUserIconRed } from './OtherUserIcon'; // Import blue and red user icons

// Use types from @types/leaflet.markercluster

interface MarkerClusterProps {
  cities: City[];
  users: MapUser[]; // <-- Add users prop
  onMarkerClick: (city: City) => void; // City-specific click handler
  onMarkerMouseOver: (city: City) => void; // City-specific mouseover handler
  onMarkerMouseOut: () => void;
  activeCityId: number | null;
  onClusterClick: () => void;
  userCoordinates: LatLngTuple | null; // Still needed? Maybe remove later if unused.
  currentUserId: string | null; // <-- Add currentUserId prop
}

/**
 * Komponente zur Darstellung der Stadt- und Benutzer-Marker mit Clustering
 */
const MarkerCluster = ({
    cities,
    users, // <-- Destructure users
    onMarkerClick,
    onMarkerMouseOver,
    onMarkerMouseOut,
    activeCityId,
    onClusterClick,
    userCoordinates, // <-- Destructure userCoordinates
    currentUserId // <-- Destructure currentUserId
}: MarkerClusterProps) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  // Use string keys for the ref to accommodate different ID types (number for city, string for user)
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  // Markercluster options remain the same
  const markerClusterOptions = useMemo(() => ({
    chunkedLoading: true,
    spiderfyOnMaxZoom: false, // <-- Disable spiderfication
    disableClusteringAtZoom: 14,
    maxClusterRadius: 80,
    zoomToBoundsOnClick: true,
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
      clusterGroup.on('clusterclick', onClusterClick);
    }
    return () => {
      if (map && markerClusterGroupRef.current) {
        markerClusterGroupRef.current.off('clusterclick', onClusterClick);
        // Use clearLayers() for efficiency before removing the group
        markerClusterGroupRef.current.clearLayers();
        map.removeLayer(markerClusterGroupRef.current);
        markerClusterGroupRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map, markerClusterOptions, onClusterClick]);

  // Update markers based on cities and users
  // Clear and re-add markers whenever cities or users change
  useEffect(() => {
    if (!map || !markerClusterGroupRef.current) return;

    const currentMarkerGroup = markerClusterGroupRef.current;

    // --- Clear existing markers ---
    currentMarkerGroup.clearLayers(); // Remove all markers from the group
    markersRef.current = {}; // Reset our internal tracking

    // --- Create and add new markers ---
    // Combine cities and users into a single list
    const items = [
        ...cities.map(c => ({ ...c, type: 'city' as const, uniqueId: `city-${c.id}` })),
        ...users.map(u => ({ ...u, type: 'user' as const, uniqueId: `user-${u.user_id}` }))
    ];

    const markersToAdd: L.Marker[] = [];
    items.forEach(item => {
      let marker: L.Marker;
      if (item.type === 'city') {
        marker = L.marker([item.latitude, item.longitude], {
          icon: createSvgMarkerIcon(item.population) // City icon
        });
        marker.on('click', () => onMarkerClick(item));
        marker.on('mouseover', () => { if (activeCityId === null) onMarkerMouseOver(item); });
        marker.on('mouseout', onMarkerMouseOut);
        marker.bindTooltip(item.name, { permanent: false, direction: 'top', className: 'custom-tooltip' });
      } else { // item.type === 'user'
        // Determine icon based on whether it's the current user
        const icon = item.user_id === currentUserId ? currentUserIconRed : otherUserIconBlue;
        marker = L.marker([item.latitude, item.longitude], {
          icon: icon
        });
        // Attach userId to the marker instance for later checks in iconCreateFunction
        (marker as any).userId = item.user_id;
        marker.bindTooltip(item.name, { permanent: false, direction: 'top', className: 'custom-tooltip' });
      }

      markersRef.current[item.uniqueId] = marker; // Track the new marker
      markersToAdd.push(marker);
    });

    if (markersToAdd.length > 0) {
      if (markerClusterGroupRef.current) {
          markerClusterGroupRef.current.addLayers(markersToAdd);
      }
    }

  // Dependencies: include users array now
  }, [map, cities, users, onMarkerClick, onMarkerMouseOver, onMarkerMouseOut, activeCityId, userCoordinates, currentUserId]); // Add currentUserId dependency

  return null; // Component only manages the Leaflet layer
};

export default MarkerCluster;
