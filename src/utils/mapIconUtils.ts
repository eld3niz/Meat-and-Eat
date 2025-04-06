import L from 'leaflet';
import { City } from '../types'; // Assuming City type is needed indirectly or for potential future use
import { MapUser } from '../hooks/useMapData'; // Assuming MapUser type is needed

// Define MarkerDefinition locally or import if moved to a shared types file
// This definition is needed by createSingleMarkerClusterIcon
export interface MarkerDefinition {
  id: string; // Can be city ID or user ID + type prefix
  latitude: number;
  longitude: number;
  type: 'city' | 'user';
  name: string;
  userId?: string | null; // Only relevant for type 'user'
  population?: number; // Only relevant for type 'city'
  originalItem: City | MapUser; // Keep the original data structure
}

// Helper function to create styled divIcon for single markers (mimicking clusters)
export const createSingleMarkerClusterIcon = (markerDef: MarkerDefinition, currentUserId: string | null): L.DivIconOptions => {
  const isCurrentUser = markerDef.type === 'user' && markerDef.userId === currentUserId;

  const sizeClass = 'w-8 h-8 text-xs'; // Match cluster size
  const sizeValue = 32; // w-8 -> 32px

  let bgColorClass = '';
  // Determine background color based on user status or default blue
  if (isCurrentUser) {
      bgColorClass = 'bg-red-500 border-red-600'; // Red for current user
  } else {
      bgColorClass = 'bg-blue-500 border-blue-600'; // Blue for cities and other users
  }

  // For single markers, display '1'.
  const iconHtml = `<span>1</span>`;

  const html = `<div class="flex items-center justify-center ${sizeClass} ${bgColorClass} text-white font-semibold rounded-full border-2 border-white shadow-md">${iconHtml}</div>`;

  return {
    html: html,
    className: 'marker-cluster-custom', // Use a consistent class
    iconSize: L.point(sizeValue, sizeValue),
    iconAnchor: L.point(sizeValue / 2, sizeValue / 2)
  };
};

// Potential future home for createSvgMarkerIcon if needed elsewhere
// import { formatPopulation } from './mapUtils'; // Assuming mapUtils exists
// export const createSvgMarkerIcon = (population: number): L.DivIcon => { ... };

// Potential future home for user icons if needed elsewhere
// export const otherUserIconBlue = L.divIcon({ ... });
// export const currentUserIconRed = L.divIcon({ ... });