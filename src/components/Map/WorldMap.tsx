import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'; // Added React import for JSX rendering in popups
import ReactDOMServer from 'react-dom/server'; // Needed to render React components into Leaflet popups
import { MapContainer, TileLayer, ZoomControl, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapData, MapUser } from '../../hooks/useMapData';
import MarkerCluster from './MarkerCluster'; // For zoom < 14
import TileAggregateLayer from './TileAggregateLayer'; // For zoom >= 14
// TiledMarkersLayer import removed
import InfoPopup from './InfoPopup'; // Existing city popup
import UserInfoPopup from './UserInfoPopup'; // <-- Import new User Info Popup
import TileListPopup from '../UI/TileListPopup'; // <-- Import new Tile List Popup
import Sidebar from '../UI/Sidebar';
import CityTable from '../UI/CityTable';
import UserTable from '../UI/UserTable';
import { City } from '../../types';
import UserLocationMarker from './UserLocationMarker'; // <-- Import UserLocationMarker
import L, { Map as LeafletMap, Popup } from 'leaflet'; // <-- Import Popup type
import { useMapTilingData } from '../../hooks/useMapTilingData'; // <-- Import new hook
import { calculateDistance, calculateHaversineDistance, isCityWithinRadius, throttle, debounce, getTileCenterLatLng, getTileId, calculateBorderPoint } from '../../utils/mapUtils'; // Added getTileCenterLatLng, getTileId, and calculateBorderPoint
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import Button from '../UI/Button';

// --- Helper Components (No changes needed) ---
// Removed MapCenterController as flyTo is now handled directly in event handlers
const MapBoundsController = () => {
  const map = useMap();
  useEffect(() => { /* ... bounds logic ... */
    const southWest = L.latLng(-85, -180); const northEast = L.latLng(85, 180); const bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds); map.options.maxBoundsViscosity = 1.0; map.setMinZoom(2);
    map.on('drag', function() { map.panInsideBounds(bounds, { animate: false }); });
    // @ts-ignore
    if (map.options.crs && map.options.crs.wrapLng) { /* @ts-ignore */ map.options.crs.wrapLng = [-180, 180]; }
    setTimeout(() => { if (map) map.invalidateSize(); }, 100);
  }, [map]);
  return null;
};
interface MapEventHandlersProps {
  onZoomEnd: () => void;
  onMoveEnd: () => void;
  onMapClick: (event: L.LeafletMouseEvent) => void; // Add map click handler prop
}

const MapEventHandlers = ({ onZoomEnd, onMoveEnd, onMapClick }: MapEventHandlersProps) => {
  const map = useMap();
  useEffect(() => {
    map.on('zoomend', onZoomEnd);
    map.on('moveend', onMoveEnd);
    map.on('click', onMapClick); // Attach map click listener

    return () => {
      map.off('zoomend', onZoomEnd);
      map.off('moveend', onMoveEnd);
      map.off('click', onMapClick); // Detach map click listener
    };
  }, [map, onZoomEnd, onMoveEnd, onMapClick]); // Add onMapClick dependency
  return null;
};

// --- Blurred Background Component ---
const BlurredBackgroundMap = () => (
  <div className="absolute inset-0 z-0 filter blur-sm pointer-events-none">
    <MapContainer
      center={[20, 0]} // Default center
      zoom={2} // Default zoom
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false} // Hide attribution on blurred map
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </MapContainer>
  </div>
);


// --- Main WorldMap Component ---
const WorldMap = () => {
  // --- Hooks (MUST be called unconditionally at the top) ---
  // Get userCoordinates from context
  const { user, locationPermissionStatus, userCoordinates, loading: authLoading, isFetchingLocation, requestLocationPermission } = useAuth(); // Added isFetchingLocation, requestLocationPermission
  // Get map data including other user locations
  const {
    loading: mapDataLoading, // Represents city loading state
    error: mapDataError,     // Represents city error state
    filteredCities,          // Cities filtered by all active filters
    selectCity,
    filterByCountry,
    filterByPopulation,
    resetFilters,
    zoomToCity,
    filteredUsers,           // <-- Use filteredUsers for display
    loadingOtherUsers,
    errorOtherUsers,
    filterByDistance,        // <-- Get filterByDistance from hook
    // Destructure new filter functions
    filterByLocalStatus,
    filterByBudget,
    // ---
    filters,                 // <-- Get filters state object
    cities                   // <-- Get original cities array
  } = useMapData();
  const { openAuthModal } = useModal(); // Get modal function
  const [clickedCity, setClickedCity] = useState<City | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState<number>(2);
  // Fix: Use renamed LeafletMap type for ref
  const mapRef = useRef<LeafletMap | null>(null);
  // const [userPosition, setUserPosition] = useState<[number, number] | null>(null); // No longer needed, comes from useAuth
  // const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // Now managed within useMapData
  // const [filteredByDistance, setFilteredByDistance] = useState<City[]>([]); // Now managed within useMapData
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null); // Keep for drawing circle
  const [isFlying, setIsFlying] = useState(false); // State to track map animation
  const aggregatePopupRef = useRef<Popup | null>(null); // Ref for aggregate list popup instance
  const userInfoPopupRef = useRef<Popup | null>(null); // Ref for user info popup instance
  const [openPopupData, setOpenPopupData] = useState<{ type: 'user', user: MapUser, ref: React.MutableRefObject<Popup | null> } | { type: 'aggregate', items: (City | MapUser)[], center: L.LatLng, ref: React.MutableRefObject<Popup | null> } | null>(null); // Track open non-city popup
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // <-- State for sidebar visibility

  // --- Popup Closing Utility (Defined early as it's used by other callbacks) ---
  const closeAllPopups = useCallback(() => {
    setClickedCity(null); // Close city info popup
    aggregatePopupRef.current?.remove(); // Close aggregate list popup
    aggregatePopupRef.current = null;
    userInfoPopupRef.current?.remove(); // Close user info popup
    userInfoPopupRef.current = null;
    setOpenPopupData(null); // Clear open popup data state
  }, []); // No dependencies needed

  // --- Callbacks (Defined after state, before early returns) ---
  // Removed handleUserPositionUpdate as position comes from context

  // Update handleDistanceFilter to use the function from the hook and manage radius state
  const handleDistanceFilter = useCallback((distance: number | null) => {
    closeAllPopups(); // Close any existing popups immediately
    filterByDistance(distance); // Call hook function to update filters
    setDistanceRadius(distance); // Update local state for drawing the circle

    // --- Automatic Zooming Logic ---
    const map = mapRef.current;
    // Zoom only if map is ready, user location known, distance is valid (not "All"), and not currently animating
    if (map && userCoordinates && distance && distance > 0 && distance < 500 && !isFlying) {
      // Save current flying state and update it
      setIsFlying(true);

      // Rest of the zoom calculation logic remains the same
      const diameterInMeters = distance * 2000; // Diameter for vertical fit
      const [userLat, userLng] = userCoordinates;

      // Calculate the latitude span needed for the diameter
      // Approx 111,132 meters per degree of latitude
      const latDelta = diameterInMeters / 111132;

      // Create bounds representing the vertical span at the user's longitude
      const southBound = userLat - latDelta / 2;
      const northBound = userLat + latDelta / 2;
      const targetVerticalBounds = L.latLngBounds(
        [southBound, userLng], // Use user's longitude
        [northBound, userLng]  // Use user's longitude
      );

      // Calculate the zoom level required to fit these vertical bounds within the map view
      const targetZoom = map.getBoundsZoom(targetVerticalBounds, false); // 'false' means map view fits *within* bounds vertically

      // Fly to the user's location at the calculated zoom level
      map.flyTo(userCoordinates, targetZoom, { animate: true, duration: 0.5 });

      // Reset flying state after animation completes
      setTimeout(() => {
        setIsFlying(false);
      }, 600); // Slightly longer than the animation duration
    }
  }, [filterByDistance, userCoordinates, isFlying, closeAllPopups, mapRef, setIsFlying]);

  // --- Sidebar Toggle Handler ---
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // --- (closeAllPopups definition moved up) ---

  // --- Popup Close Handler (Needed by handleMarkerClick) ---
  const handlePopupClose = useCallback(() => {
    // This might be called by the InfoPopup component's close button
    setClickedCity(null);
    // Note: Leaflet handles closing its own popups (aggregate/user) on map click by default
    // We manually remove them if another popup needs to open.
  }, []);

  // --- Existing City Marker Click Handler ---
  const handleMarkerClick = useCallback((city: City, event?: L.LeafletMouseEvent) => { // Add optional event parameter
    const map = mapRef.current;
    if (!map || isFlying) return;

    closeAllPopups(); // Close any other open popups first
    setIsFlying(true);
    // Use event latlng if available, otherwise fallback to city coords (e.g., if called from table)
    const targetLatLng = event ? event.latlng : L.latLng(city.latitude, city.longitude);
    const targetCoords: [number, number] = [targetLatLng.lat, targetLatLng.lng];
    const currentZoom = map.getZoom();
    const minDetailZoom = 7;
    const targetZoom = Math.max(currentZoom, minDetailZoom);

    map.flyTo(targetCoords, targetZoom, { duration: 1.0 });

    // Open the popup *immediately* at the clicked location, animation happens separately
    const popupContent = ReactDOMServer.renderToString(<InfoPopup city={city} onClose={handlePopupClose} />);
    L.popup({ closeButton: true, minWidth: 250, className: 'info-popup-container' }) // Use the correct class
      .setLatLng(targetLatLng) // Use the clicked LatLng
      .setContent(popupContent)
      .openOn(map);

    // Set clicked city state *immediately* to manage the popup instance logic, but don't rely on it for position
    setClickedCity(city);

    // Animation still happens, but popup is already open
    setTimeout(() => {
      // setMapCenter(targetCoords); // State update might not be needed if flyTo handles it
      // setMapZoom(targetZoom); // State update might not be needed if flyTo handles it
      // setClickedCity(city); // Already set above
      setIsFlying(false);
    }, 1000);
  }, [isFlying, closeAllPopups, handlePopupClose]); // Dependency is now valid

  // --- (handlePopupClose definition moved up) ---

  // TODO: Update handleCitySelect if users should also be selectable/zoomable from Sidebar/Table
  const handleCitySelect = useCallback((cityId: number) => {
    const map = mapRef.current;
    const coords = zoomToCity(cityId); // Get coordinates first
    if (!map || !coords || isFlying) return; // Prevent action if map not ready, coords missing, or already animating

    setIsFlying(true);
    const targetZoom = 7;
    const city = filteredCities.find(c => c.id === cityId); // Find city data

    map.flyTo(coords, targetZoom, { duration: 1.5 });
    selectCity(cityId); // Select city in the data hook immediately

    setTimeout(() => {
      setMapCenter(coords); // Update state after animation
      setMapZoom(targetZoom);
      if (city) { setClickedCity(city); } // Show popup after animation
      setIsFlying(false);
    }, 1500); // Match flyTo duration
  }, [zoomToCity, selectCity, filteredCities, isFlying, closeAllPopups]); // Added closeAllPopups


  const throttledHandleZoom = useCallback(throttle(() => { if (mapRef.current) { setMapZoom(mapRef.current.getZoom()); } }, 100), []);
  const debouncedHandleMapMove = useCallback(debounce(() => {
    if (isFlying || !mapRef.current) return; // Do nothing if animating or map not ready
    const map = mapRef.current; // Get map instance
    const c = map.getCenter();
    setMapCenter([c.lat, c.lng]);

    // Auto-close popup if marker is out of bounds
    if (clickedCity) {
      const bounds = map.getBounds();
      const cityLatLng = L.latLng(clickedCity.latitude, clickedCity.longitude);
      if (!bounds.contains(cityLatLng)) {
        setClickedCity(null);
      }
    }
  }, 150), [isFlying, clickedCity, closeAllPopups]); // Add closeAllPopups dependency

  // Close clicked popup when clicking outside of it
  const handleMapClick = useCallback((event: L.LeafletMouseEvent) => {
    const targetElement = event.originalEvent.target as HTMLElement;
    // Ignore clicks on markers or inside our known popup containers
    if (
        targetElement.closest('.leaflet-marker-icon') ||
        targetElement.closest('.info-popup-container') || // Existing city popup
        targetElement.closest('.tile-list-popup-container') || // New aggregate list
        targetElement.closest('.user-info-popup-container') // New user info
    ) {
      return; // Click was inside a marker or popup, do nothing
    }
    // Otherwise, close all popups
    closeAllPopups();
  }, [closeAllPopups]); // Dependency on closeAllPopups

  // Handler for clicking the user's own location marker
  const handleUserMarkerClick = useCallback(() => {
    // First, ensure we're not in flying state to prevent animation conflicts
    setIsFlying(false);
    
    // Close all existing popups
    closeAllPopups();
    
    // Check if user coordinates are available before proceeding
    if (!userCoordinates || !mapRef.current) return;
    
    // Force animation to happen by explicitly setting flying state
    setIsFlying(true);
    
    // Call handleDistanceFilter with 1km radius.
    // This will trigger the filtering, circle update, and UI updates
    filterByDistance(1); // Update filter state
    setDistanceRadius(1); // Update radius circle
    
    // Calculate proper zoom level for 1km radius
    const map = mapRef.current;
    const [userLat, userLng] = userCoordinates;
    
    // Calculate bounds for 1km radius (2km diameter)
    const diameterInMeters = 2000; // 2km diameter (1km radius)
    const latDelta = diameterInMeters / 111132;
    
    // Calculate bounds precisely
    const southBound = userLat - latDelta / 2;
    const northBound = userLat + latDelta / 2;
    const targetBounds = L.latLngBounds(
      [southBound, userLng],
      [northBound, userLng]
    );
    
    // Get optimal zoom level to fit the radius
    const targetZoom = map.getBoundsZoom(targetBounds, false);
    
    // Explicitly fly to user location with the calculated zoom
    map.flyTo(userCoordinates, targetZoom, { 
      animate: true, 
      duration: 0.8  // Slightly longer for smoother animation
    });
    
    // Reset flying state after animation completes
    setTimeout(() => {
      setIsFlying(false);
    }, 1000); // Slightly longer than animation duration
    
  }, [userCoordinates, mapRef, closeAllPopups, setIsFlying, filterByDistance, setDistanceRadius]);

  // Handler to zoom the map to the current distance filter radius around the user
  const handleZoomToRadius = useCallback(() => {
    const map = mapRef.current;
    // Use filters.distance from useMapData hook
    const distance = filters.distance;
    if (!map || !userCoordinates || !distance || distance <= 0 || distance >= 500 || isFlying) return;

    setIsFlying(true);
    const radiusInMeters = distance * 1000;
    const [userLat, userLng] = userCoordinates;
    const latDelta = radiusInMeters / 111132;
    const lngDelta = radiusInMeters / (111320 * Math.cos(userLat * Math.PI / 180));
    const southWest = L.latLng(userLat - latDelta, userLng - lngDelta);
    const northEast = L.latLng(userLat + latDelta, userLng + lngDelta);
    const calculatedBounds = L.latLngBounds(southWest, northEast);
    map.flyToBounds(calculatedBounds, { padding: [50, 50], duration: 1.0 });

    setTimeout(() => setIsFlying(false), 1000); // Match duration
  }, [userCoordinates, filters.distance, isFlying]); // Add filters.distance dependency

  // Wrapper function for resetting filters to also clear the distance radius circle
  const handleResetFilters = useCallback(() => {
    resetFilters(); // Call the original function from the hook
    setDistanceRadius(null); // Reset the local state for the circle
    setClickedCity(null); // Close any open popups
  }, [resetFilters, closeAllPopups]); // Added closeAllPopups

  // --- Unified Item Click Handler (for markers at tile centers) ---
  const handleItemClick = useCallback((item: City | MapUser, markerPosition?: L.LatLng, event?: L.LeafletMouseEvent) => {
    if ('population' in item) { // It's a City
      // Reuse existing city marker click logic
      handleMarkerClick(item, event);
    } else { // It's a MapUser
      // Use the marker's actual position if provided, otherwise fall back to event or item coordinates
      const position = markerPosition || 
                      (event ? event.latlng : L.latLng(item.latitude, item.longitude));
      
      const map = mapRef.current;
      if (!map) return;

      closeAllPopups();

      const content = ReactDOMServer.renderToString(
        <UserInfoPopup user={item} onClose={closeAllPopups} />
      );

      // Add fixed offset of 15px above the marker
      const popup = L.popup({ 
        closeButton: false, 
        minWidth: 100, 
        className: 'custom-leaflet-popup',
        offset: [0, -15] // Add 15px vertical offset
      })
        .setLatLng(position) // Use the position from marker
        .setContent(content)
        .openOn(map);

      popup.getElement()?.querySelector('#user-popup-close-btn')?.addEventListener('click', closeAllPopups);

      userInfoPopupRef.current = popup;
      setOpenPopupData({ type: 'user', user: item, ref: userInfoPopupRef });
    }
  }, [handleMarkerClick, closeAllPopups]);

  // --- Handler for clicking an aggregate marker representing a tile ---
  const handleAggregateTileClick = useCallback((items: (City | MapUser)[], markerPosition: L.LatLng) => {
    const map = mapRef.current;
    if (!map) return;

    closeAllPopups();

    // Create the popup at the marker's position with offset
    const popup = L.popup({ 
      closeButton: true,
      offset: [0, -15] // Add 15px vertical offset
    })
      .setLatLng(markerPosition) // Use actual marker position
      .setContent('') // Set content to an empty string as before
      .openOn(map);

    aggregatePopupRef.current = popup;
    setOpenPopupData({ 
      type: 'aggregate', 
      items, 
      center: markerPosition, // Store the marker position
      ref: aggregatePopupRef 
    });
  }, [closeAllPopups]);

  // --- Memos (Defined after state, before early returns) ---

  // Note: filteredCities from useMapData already includes distance filtering
  const filteredStats = useMemo(() => {
      if (!userCoordinates || !filters.distance || filters.distance >= 500) return null;
      const totalCities = cities.length;
      const visibleCities = filteredCities.length;
      if (totalCities === 0) return { totalCities: 0, visibleCities: 0, percentage: 0 };
      return { totalCities, visibleCities, percentage: Math.round((visibleCities / totalCities) * 100) };
  }, [userCoordinates, filters.distance, filteredCities, cities]);

  // Prepare user list for display. Include current user ONLY if zoom < 14 for clustering.
  const allUsersForDisplay = useMemo(() => {
    const users = [...filteredUsers]; // Start with other users
    // Conditionally add the current user if zoom is low enough for clustering
    if (mapZoom < 14 && user && userCoordinates) {
      const currentUserMapUser: MapUser = {
        user_id: user.id,
        name: "Your Location", // Name used within cluster data
        latitude: userCoordinates[0],
        longitude: userCoordinates[1]
      };
      // Add only if not somehow already present (unlikely but safe)
      if (!users.some(u => u.user_id === currentUserMapUser.user_id)) {
        users.push(currentUserMapUser);
      }
    }
    return users;
  }, [filteredUsers, user, userCoordinates, mapZoom]); // Add mapZoom dependency

  // --- Hook for Tiling Data Aggregation ---
  const tileAggregationData = useMapTilingData(
    filteredCities, // Use all filtered cities
    allUsersForDisplay, // Use combined user list
    user?.id ?? null
    // No longer pass zoom condition
  );

  // Define MarkerDefinition interface (or move to types/index.ts)
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

  // --- Transform Tile Data into Markers for Clustering (Adjusted Positions) ---
  const markersForClustering = useMemo((): MarkerDefinition[] => {
    const markers: MarkerDefinition[] = [];
    const currentUserLatLng = userCoordinates ? L.latLng(userCoordinates[0], userCoordinates[1]) : null;

    tileAggregationData.forEach((tileData, tileId) => {
      try {
        const tileCenter = getTileCenterLatLng(tileId);
        let finalPosition = tileCenter; // Default to tile center

        // --- Start of Position Adjustment Logic ---
        if (currentUserLatLng && distanceRadius !== null && tileData.items.length > 0) {
          // Check if any item in the tile is *actually* within the radius
          const isAnyItemInsideRadius = tileData.items.some(item => {
            // Ensure item has valid coordinates before calculating distance
            if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
                return false; // Skip items without coordinates
            }
            const itemLatLng = L.latLng(item.latitude, item.longitude);
            const distanceToItem = calculateHaversineDistance(
              currentUserLatLng.lat, currentUserLatLng.lng,
              itemLatLng.lat, itemLatLng.lng
            );
            return distanceToItem <= distanceRadius;
          });

          if (isAnyItemInsideRadius) {
            // At least one item is inside. Now check the tile center's distance.
            const distanceToTileCenter = calculateHaversineDistance(
              currentUserLatLng.lat, currentUserLatLng.lng,
              tileCenter.lat, tileCenter.lng
            );

            if (distanceToTileCenter > distanceRadius) {
              // An item is inside, but the tile center is outside. Adjust position to border.
              finalPosition = calculateBorderPoint(currentUserLatLng, tileCenter, distanceRadius);
            }
            // else: An item is inside, and the tile center is also inside. Use original tileCenter (finalPosition).
          }
          // else: No items in this tile are within the radius. Use original tileCenter (finalPosition).
        }
        // --- End of Position Adjustment Logic ---


        // Create markers using the calculated finalPosition for this tile
        tileData.items.forEach(item => {
          if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
             console.warn('Item missing coordinates during transformation, skipping:', item);
             return; // Skip items without valid original coordinates
          }

          const markerDef: MarkerDefinition = {
            id: 'population' in item ? `city-${item.id}` : `user-${item.user_id}`,
            latitude: finalPosition.lat, // <-- Use adjusted latitude
            longitude: finalPosition.lng, // <-- Use adjusted longitude
            type: 'population' in item ? 'city' : 'user',
            name: item.name,
            userId: 'user_id' in item ? item.user_id : null,
            population: 'population' in item ? item.population : undefined,
            originalItem: item // Keep original item data for click handlers
          };
          markers.push(markerDef);
        });
      } catch (error) {
          console.error(`Error processing tile ${tileId}:`, error);
      }
    });
    return markers;
    // Add userCoordinates and distanceRadius as dependencies
  }, [tileAggregationData, userCoordinates, distanceRadius]);


// Removed handleClusterClick as it's no longer needed; default zoom is handled by MarkerCluster component itself.
// Popup logic is now handled by handleAggregateTileClick for the TileAggregateLayer.

  // --- Cluster Click Handler (Opens TileListPopup) ---
  // Moved after markersForClustering definition to resolve dependency order issue
// Removing duplicate handleClusterClick definition

  // --- Effects (Defined after state, before early returns) ---
  // useEffect for filteredByDistance is removed, as filtering is now memoized in useMapData

  useEffect(() => {
    const handleResize = () => { if (mapRef.current) { mapRef.current.invalidateSize(); } };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => handleResize(), 100);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); }
  }, []);

  // Effect to invalidate map size when sidebar collapses/expands
  useEffect(() => {
    // Delay invalidateSize to allow sidebar transition to finish
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 350); // Slightly longer than sidebar transition (300ms)

    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]); // Run when sidebar state changes

  // --- Effect to Update or Close Open Popups on Filter Changes ---
  useEffect(() => {
    if (!openPopupData || !mapRef.current) return; // No popup open or map not ready

    const map = mapRef.current;
    const currentPopupRef = openPopupData.ref;

    if (openPopupData.type === 'user') {
      // Check if the single user is still in the filtered list
      const userStillVisible = filteredUsers.some(u => u.user_id === openPopupData.user.user_id);
      if (!userStillVisible) {
        // User filtered out, close the popup
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
        setOpenPopupData(null);
      }
      // Optional: If user details could change dynamically, re-render and setContent here
      // else {
      //   const updatedUser = filteredUsers.find(u => u.user_id === openPopupData.user.user_id);
      //   if (updatedUser) {
      //      const content = ReactDOMServer.renderToString(
      //        <UserInfoPopup user={updatedUser} onClose={() => currentPopupRef.current?.remove()} />
      //      );
      //      currentPopupRef.current?.setContent(content);
      //      // Update state if necessary, careful about infinite loops
      //      // setOpenPopupData(prev => prev ? { ...prev, user: updatedUser } : null);
      //   }
      // }

    } else if (openPopupData.type === 'aggregate') {
      // Find the corresponding tile data in the *new* tileAggregationData
      const tileId = getTileId(openPopupData.center.lat, openPopupData.center.lng);
      const updatedTileData = tileAggregationData.get(tileId);

      // For aggregate popups, we only check if the data changed to update state,
      // or if the tile became empty to close the popup. We DO NOT set content here.
      if (updatedTileData && updatedTileData.items.length > 0) {
        // Tile still exists and has items.
        // Update state ONLY if items actually changed to prevent infinite loop
        setOpenPopupData(prev => {
          if (prev && prev.type === 'aggregate') {
            const oldItems = prev.items;
            const newItems = updatedTileData.items;
            const oldIds = oldItems.map(item => 'population' in item ? `c-${item.id}` : `u-${item.user_id}`).sort();
            const newIds = newItems.map(item => 'population' in item ? `c-${item.id}` : `u-${item.user_id}`).sort();

            if (oldIds.join(',') !== newIds.join(',')) {
              // Items have changed, update state
              return { ...prev, items: newItems };
            }
            // Items are the same, return previous state to avoid re-render trigger
            return prev;
          }
          return null; // Should not happen if type was aggregate, but good practice
        });
      } else {
        // Tile is gone or empty, close the popup
        console.log(`Closing aggregate popup for tile ${tileId} as it's now empty.`);
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
        setOpenPopupData(null);
      }
    }
  // Dependencies: Run when filters change (affecting filteredUsers/tileAggregationData) or when a popup is opened/closed
  }, [filteredUsers, tileAggregationData, openPopupData, mapRef]);


  const RadiusCircle = useCallback(() => {
      // Use userCoordinates from context
      // Ensure radius is valid and positive before rendering
      if (!userCoordinates || !distanceRadius || distanceRadius <= 0 || distanceRadius >= 500) return null;
      return (<Circle center={userCoordinates} radius={distanceRadius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />);
  }, [userCoordinates, distanceRadius]); // Update dependencies


  // --- Conditional Returns (Now safe, as all hooks are defined above) ---
  // Combine loading states
  const isLoading = authLoading || mapDataLoading || loadingOtherUsers;
  if (isLoading) {
    return ( <div className="flex items-center justify-center h-full w-full bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div> );
  }

  // --- Case 1: User Not Logged In ---
  if (!user) {
    // No changes needed here
    return (
      <div className="relative h-full w-full overflow-hidden"> {/* Parent container */}
        <BlurredBackgroundMap /> {/* Background */}
        <div className="relative z-10 flex items-center justify-center h-full w-full text-center p-8 bg-gray-800 bg-opacity-50"> {/* Foreground with semi-transparent overlay */}
          <div className="max-w-md bg-white p-8 rounded-lg shadow-xl"> {/* Inner content box */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Unlock the Full Map Experience!</h2>
            <p className="text-gray-600 mb-6">
              Log in or create an account to view the interactive map, discover culinary spots, and save your favorites.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={openAuthModal} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">Log In</Button>
              <Button onClick={openAuthModal} className="border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500">Sign Up</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 2: Logged In, Location Permission Not Granted ---
  if (locationPermissionStatus !== 'granted') {
    // No changes needed here
    let message = "To use location-based features like distance filtering and seeing your position, please grant location access.";
    if (locationPermissionStatus === 'denied') { message = "It looks like location access was denied. We need your location to show relevant information based on proximity. Please grant permission to continue."; }
    else if (locationPermissionStatus === 'unavailable') { message = "We couldn't access your location. This might be because your browser doesn't support it, or there was an issue retrieving it. Please ensure location services are enabled on your device and try again."; }
    const additionalGuidance = "If you previously denied permission and don't see a prompt, please check your browser's site settings for this website and allow location access.";
    return (
      <div className="relative h-full w-full overflow-hidden"> {/* Parent container */}
        <BlurredBackgroundMap /> {/* Background */}
        <div className="relative z-10 flex items-center justify-center h-full w-full text-center p-8 bg-gray-800 bg-opacity-50"> {/* Foreground with semi-transparent overlay */}
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"> {/* Inner content box */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Location Access Required</h2>
            <p className="text-gray-600 mb-4 text-left">{message}</p> {/* Align text left */}
            {locationPermissionStatus === 'denied' && (<p className="text-sm text-gray-500 mb-6 text-left">{additionalGuidance}</p>)}
            <div className="flex justify-end">
              <Button onClick={requestLocationPermission} className="bg-blue-500 hover:bg-blue-600 text-white">
                {locationPermissionStatus === 'denied' ? 'Retry Granting Access' : 'Check Location Access'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 3: Map Data Error (User logged in, permission granted) ---
  // Combine error states
  const dataError = mapDataError || errorOtherUsers;
  if (dataError) {
    // Display a generic error or specific ones based on which error occurred
    const errorMessage = mapDataError ? `Fehler beim Laden der Städtedaten: ${mapDataError}` : `Fehler beim Laden der Benutzerstandorte: ${errorOtherUsers}`;
    return ( <div className="flex items-center justify-center h-full w-full"><div className="text-red-500 max-w-md p-4 bg-red-50 rounded-lg border border-red-100"><h2 className="text-xl font-bold mb-2">Fehler beim Laden der Kartendaten</h2><p>{errorMessage}</p><button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Neu laden</button></div></div> );
  }

  // --- Render Map and UI (Only if logged in, permission granted, no errors) ---
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full">
        {/* Sidebar - Needs update to accept and display users */}
        <Sidebar
          cities={filteredCities} // Pass filtered cities
          users={filteredUsers} // <-- Pass filtered users
          // onUserSelect={handleUserSelect} // TODO: Add handler for selecting users
          onCitySelect={handleCitySelect}
          onCountryFilter={filterByCountry}
          onPopulationFilter={filterByPopulation}
          onDistanceFilter={handleDistanceFilter} // Pass the updated handler
          // Pass new filter props
          onLocalFilter={filterByLocalStatus}
          onBudgetFilter={filterByBudget}
          currentLocalFilter={filters.is_local}
          currentBudgetFilter={filters.budget}
          // ---
          onResetFilters={handleResetFilters} // Pass the new wrapper function
          loading={mapDataLoading || loadingOtherUsers} // Combined loading state for sidebar?
          userPosition={userCoordinates}
          filteredStats={filteredStats} // Stats might need update if based on users too
          currentDistanceFilter={filters.distance} // <-- Pass current distance filter value
          isCollapsed={isSidebarCollapsed} // <-- Pass state
          onToggleCollapse={handleToggleSidebar} // <-- Pass handler
          isLocationLoading={isFetchingLocation} // <-- Pass location fetching status
        />
        {/* Map Area */}
        <div className="flex-grow relative overflow-hidden">
          {/* Map Container */}
          <MapContainer
            center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}
            zoomControl={false} ref={mapRef} maxBoundsViscosity={1.0} worldCopyJump={false}
            bounceAtZoomLimits={true} minZoom={2} maxZoom={14} // <-- Set max zoom level
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <ZoomControl position="bottomright" />
            <MapBoundsController />
            <MapEventHandlers onZoomEnd={throttledHandleZoom} onMoveEnd={debouncedHandleMapMove} onMapClick={handleMapClick} />

            {/* --- Conditional Rendering: Cluster (Tile Centers) or Tile Aggregates --- */}
            {mapZoom < 14 ? (
              <MarkerCluster
                markersData={markersForClustering} // Individual items at tile centers
                onItemClick={handleItemClick} // Handles single item clicks
                activeCityId={clickedCity?.id ?? null}
                currentUserId={user?.id ?? null}
                userCoordinates={userCoordinates}
              />
            ) : (
              <TileAggregateLayer
                tileAggregationData={tileAggregationData}
                onItemClick={handleItemClick} // Updated handler accepts position
                onAggregateTileClick={handleAggregateTileClick} // Updated handler accepts position
                currentUserId={user?.id ?? null}
                currentUserLocation={userCoordinates ? L.latLng(userCoordinates[0], userCoordinates[1]) : null}
                distanceRadius={distanceRadius}
              />
            )}
            {/* --- End Conditional Rendering --- */}

            {/* REMOVED separate rendering loop for OtherUserMarker - now handled by MarkerCluster */}

            {/* Render clicked popup */}
            {clickedCity && (
              <InfoPopup city={clickedCity} onClose={handlePopupClose} />
            )}

            {/* --- User Location Marker (Rendered separately ONLY at high zoom) --- */}
            {userCoordinates && mapZoom >= 14 && ( // <-- Added mapZoom condition
              <UserLocationMarker
                position={userCoordinates}
                onClick={handleUserMarkerClick} // Reuse existing handler to zoom on click
              />
            )}

            {/* --- Radius Circle (conditionally rendered by its internal logic) --- */}
            <RadiusCircle />
          </MapContainer>

          {/* Zoom Buttons Container */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
            {userCoordinates && (
              <Button
                onClick={handleUserMarkerClick} // Smaller padding and text
                className="bg-white hover:bg-gray-100 text-gray-700 text-sm py-1 px-2 border border-gray-300 rounded shadow"
                aria-label="Zoom to my location"
              >
                Zoom to Me
              </Button>
            )}
            {/* Zoom to Radius Button Removed - Zooming is now automatic */}
          </div>
        </div>
      </div>
      {/* Render City Table and User Table Separately */}
      <div className="overflow-y-auto mt-4 mb-8 px-4">
        {/* City Table Removed */}
        {/* User Table (conditionally rendered if there are users) */}
        <UserTable
            users={filteredUsers}
            userPosition={userCoordinates}
        />
      </div>
    </div>
  );
};

export default WorldMap;
