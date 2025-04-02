import { useEffect, useMemo, useRef } from 'react';
import L, { LatLngTuple } from 'leaflet'; // Import LatLngTuple
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { City } from '../../types';
import { MapUser } from '../../hooks/useMapData'; // Import MapUser
import { formatPopulation } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon';
import { otherUserIcon } from './OtherUserIcon'; // Import the green user icon

// Use types from @types/leaflet.markercluster

interface MarkerClusterProps {
  cities: City[];
  users: MapUser[]; // <-- Add users prop
  onMarkerClick: (city: City) => void; // City-specific click handler
  onMarkerMouseOver: (city: City) => void; // City-specific mouseover handler
  onMarkerMouseOut: () => void;
  activeCityId: number | null;
  onClusterClick: () => void;
  userCoordinates: LatLngTuple | null; // <-- Add userCoordinates prop
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
    userCoordinates // <-- Destructure userCoordinates
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

      // --- Check if the current user's marker is in this cluster ---
      let clusterContainsUser = false;
      if (userCoordinates) {
        const userLatLng = L.latLng(userCoordinates);
        for (const marker of childMarkers) {
          // Check if marker coordinates match the user's coordinates
          if (marker.getLatLng().equals(userLatLng)) {
            clusterContainsUser = true;
            break; // Found the user marker, no need to check further
          }
        }
      }

      // Check if all children are users and share the exact same coordinates (due to grid snapping)
      let allUsersSameSpot = false;
      if (childMarkers.length > 0 && childCount > 1) { // Only check if there's more than one marker
          const firstLatLng = childMarkers[0].getLatLng();
          // Check if all markers use the user icon AND share the same LatLng
          const areAllUsers = childMarkers.every(m => m.options.icon === otherUserIcon);
          const areAllSameLatLng = childMarkers.every(m => m.getLatLng().equals(firstLatLng));

          if (areAllUsers && areAllSameLatLng) {
              allUsersSameSpot = true;
          }
      }

      let sizeClass = 'w-8 h-8 text-xs';
      let bgClass = 'bg-blue-400 border-blue-500'; // Default blue for mixed/city clusters
      let extraClasses = ''; // For adding the blinking class

      // --- Apply styles based on cluster content ---
      if (clusterContainsUser) {
          bgClass = ''; // Remove default background, rely on blinking class
          extraClasses = 'user-cluster-blinking'; // Apply blinking red style
          sizeClass = 'w-9 h-9 text-xs'; // Slightly larger for user cluster?
      } else if (allUsersSameSpot) {
          bgClass = 'bg-green-500 border-green-600'; // Use user color (green)
          // Keep base size or adjust if needed
          sizeClass = 'w-8 h-8 text-xs'; // Or maybe slightly larger? 'w-9 h-9 text-xs'
      } else {
          // Original logic for sizing/coloring based on count for mixed/city clusters or single markers
          if (childCount >= 10) { sizeClass = 'w-10 h-10 text-sm'; bgClass = 'bg-yellow-400 border-yellow-500'; }
          if (childCount >= 30) { sizeClass = 'w-12 h-12 text-base'; bgClass = 'bg-red-400 border-red-500'; }
          // Handle single marker case if needed (though clustering might not happen for 1)
      }

      const sizeValue = parseInt(sizeClass.split(' ')[0].substring(2)) * 4; // Assuming Tailwind units are relative to 1rem=16px, w-8 -> 32px
      const html = `<div class="flex items-center justify-center ${sizeClass} ${bgClass} ${extraClasses} text-white font-semibold rounded-full border-2 border-white shadow-md"><span>${childCount}</span></div>`;

      return L.divIcon({
        html: html,
        className: 'marker-cluster-custom', // Ensure this class doesn't override the background
        iconSize: L.point(sizeValue, sizeValue),
        iconAnchor: L.point(sizeValue / 2, sizeValue / 2)
      });
    }
  // Add userCoordinates to dependency array
  }), [userCoordinates]);

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
        marker = L.marker([item.latitude, item.longitude], {
          icon: otherUserIcon // User icon
        });
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
  }, [map, cities, users, onMarkerClick, onMarkerMouseOver, onMarkerMouseOut, activeCityId, userCoordinates]); // Add userCoordinates dependency

  return null; // Component only manages the Leaflet layer
};

export default MarkerCluster;
