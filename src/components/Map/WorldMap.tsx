import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'; // Added React import for JSX rendering in popups
import ReactDOMServer from 'react-dom/server'; // Needed for InfoPopup and UserInfoPopup
import { createRoot } from 'react-dom/client'; // Import createRoot for client-side rendering in popups
import { MapContainer, TileLayer, ZoomControl, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapData, MapUser } from '../../hooks/useMapData';
import MarkerCluster from './MarkerCluster'; // For zoom < 14
import TileAggregateLayer from './TileAggregateLayer'; // For zoom >= 14
import InfoPopup from './InfoPopup'; // Existing city popup
import UserInfoPopup from './UserInfoPopup'; // <-- Currently unused?
import UserProfilePopupContent from './UserProfilePopupContent'; // <-- Import static content component
import TileListPopup from '../UI/TileListPopup';
import Sidebar from '../UI/Sidebar';
import CityTable from '../UI/CityTable';
import UserTable from '../UI/UserTable';
import { City } from '../../types';
import UserLocationMarker from './UserLocationMarker'; // <-- Import UserLocationMarker
import L, { Map as LeafletMap, Popup } from 'leaflet'; // <-- Import Popup type
import { useMapTilingData } from '../../hooks/useMapTilingData'; // <-- Import new hook
import { calculateDistance, calculateHaversineDistance, isCityWithinRadius, throttle, debounce, getTileCenterLatLng, getTileId, calculateBorderPoint } from '../../utils/mapUtils'; // Added getTileCenterLatLng, getTileId, and calculateBorderPoint
import supabase from '../../utils/supabaseClient'; // <-- Import supabase client for fetching
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import Button from '../UI/Button';
import ImageModal from '../UI/ImageModal'; // Add this import

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
    // Destructure user filter functions
    filterByAge,
    filterByGender,
    filterByLanguages,
    filterByCuisines,
    filterByBudget,
    filterByLocalStatus,     // <-- Destructure the existing local status filter function
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
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null); // Keep for drawing circle
  const [isFlying, setIsFlying] = useState(false); // State to track map animation
  const aggregatePopupRef = useRef<Popup | null>(null); // Ref for aggregate list popup instance
  const userInfoPopupRef = useRef<Popup | null>(null); // Ref for user info popup instance
  const [openPopupData, setOpenPopupData] = useState<{ type: 'user', user: MapUser, ref: React.MutableRefObject<Popup | null> } | { type: 'aggregate', items: (City | MapUser)[], center: L.LatLng, ref: React.MutableRefObject<Popup | null> } | null>(null); // Track open non-city popup
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false); // Add state for image modal
  const [currentModalImage, setCurrentModalImage] = useState<string | null>(null); // Add state for current modal image

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
  const handleDistanceFilter = useCallback((distance: number | null) => {
    closeAllPopups(); // Close any existing popups immediately
    filterByDistance(distance); // Call hook function to update filters
    setDistanceRadius(distance); // Update local state for drawing the circle

    const map = mapRef.current;
    if (map && userCoordinates && distance && distance > 0 && distance < 500 && !isFlying) {
      setIsFlying(true);

      const diameterInMeters = distance * 2000; // Diameter for vertical fit
      const [userLat, userLng] = userCoordinates;

      const latDelta = diameterInMeters / 111132;

      const southBound = userLat - latDelta / 2;
      const northBound = userLat + latDelta / 2;
      const targetVerticalBounds = L.latLngBounds(
        [southBound, userLng],
        [northBound, userLng]
      );

      const targetZoom = map.getBoundsZoom(targetVerticalBounds, false);

      map.flyTo(userCoordinates, targetZoom, { animate: true, duration: 0.5 });

      setTimeout(() => {
        setIsFlying(false);
      }, 600);
    }
  }, [filterByDistance, userCoordinates, isFlying, closeAllPopups, mapRef, setIsFlying]);

  const handlePopupClose = useCallback(() => {
    setClickedCity(null);
  }, []);

  const handleMarkerClick = useCallback((city: City, event?: L.LeafletMouseEvent) => {
    const map = mapRef.current;
    if (!map || isFlying) return;

    closeAllPopups();
    setIsFlying(true);
    const targetLatLng = event ? event.latlng : L.latLng(city.latitude, city.longitude);
    const targetCoords: [number, number] = [targetLatLng.lat, targetLatLng.lng];
    const currentZoom = map.getZoom();
    const minDetailZoom = 7;
    const targetZoom = Math.max(currentZoom, minDetailZoom);

    map.flyTo(targetCoords, targetZoom, { duration: 1.0 });

    const popupContent = ReactDOMServer.renderToString(<InfoPopup city={city} onClose={handlePopupClose} />);
    L.popup({ closeButton: true, minWidth: 250, className: 'info-popup-container' })
      .setLatLng(targetLatLng)
      .setContent(popupContent)
      .openOn(map);

    setClickedCity(city);

    setTimeout(() => {
      setIsFlying(false);
    }, 1000);
  }, [isFlying, closeAllPopups, handlePopupClose]);

  const handleCitySelect = useCallback((cityId: number) => {
    const map = mapRef.current;
    const coords = zoomToCity(cityId);
    if (!map || !coords || isFlying) return;

    setIsFlying(true);
    const targetZoom = 7;
    const city = filteredCities.find(c => c.id === cityId);

    map.flyTo(coords, targetZoom, { duration: 1.5 });
    selectCity(cityId);

    setTimeout(() => {
      setMapCenter(coords);
      setMapZoom(targetZoom);
      if (city) { setClickedCity(city); }
      setIsFlying(false);
    }, 1500);
  }, [zoomToCity, selectCity, filteredCities, isFlying, closeAllPopups]);

  const throttledHandleZoom = useCallback(throttle(() => { if (mapRef.current) { setMapZoom(mapRef.current.getZoom()); } }, 100), []);
  const debouncedHandleMapMove = useCallback(debounce(() => {
    if (isFlying || !mapRef.current) return;
    const map = mapRef.current;
    const c = map.getCenter();
    setMapCenter([c.lat, c.lng]);

    if (clickedCity) {
      const bounds = map.getBounds();
      const cityLatLng = L.latLng(clickedCity.latitude, clickedCity.longitude);
      if (!bounds.contains(cityLatLng)) {
        setClickedCity(null);
      }
    }
  }, 150), [isFlying, clickedCity]);

  const handleMapClick = useCallback((event: L.LeafletMouseEvent) => {
    const targetElement = event.originalEvent.target as HTMLElement;
    if (
        targetElement.closest('.leaflet-marker-icon') ||
        targetElement.closest('.info-popup-container') ||
        targetElement.closest('.tile-list-popup-container') ||
        targetElement.closest('.user-info-popup-container')
    ) {
      return;
    }
    closeAllPopups();
  }, [closeAllPopups]);

  const handleUserMarkerClick = useCallback(() => {
    setIsFlying(false);
    closeAllPopups();
    if (!userCoordinates || !mapRef.current) return;
    setIsFlying(true);
    filterByDistance(1);
    setDistanceRadius(1);

    const map = mapRef.current;
    const [userLat, userLng] = userCoordinates;

    const diameterInMeters = 2000;
    const latDelta = diameterInMeters / 111132;

    const southBound = userLat - latDelta / 2;
    const northBound = userLat + latDelta / 2;
    const targetBounds = L.latLngBounds(
      [southBound, userLng],
      [northBound, userLng]
    );

    const targetZoom = map.getBoundsZoom(targetBounds, false);

    map.flyTo(userCoordinates, targetZoom, { 
      animate: true, 
      duration: 0.8
    });

    setTimeout(() => {
      setIsFlying(false);
    }, 1000);
  }, [userCoordinates, mapRef, closeAllPopups, setIsFlying, filterByDistance, setDistanceRadius]);

  const handleZoomToRadius = useCallback(() => {
    const map = mapRef.current;
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

    setTimeout(() => setIsFlying(false), 1000);
  }, [userCoordinates, filters.distance, isFlying]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setDistanceRadius(null);
    setClickedCity(null);
  }, [resetFilters, closeAllPopups]);

  const handleItemClick = useCallback((item: City | MapUser, markerPosition?: L.LatLng, event?: L.LeafletMouseEvent) => {
    if ('population' in item) {
      handleMarkerClick(item, event);
    } else {
      // Handle user click (render static profile in popup)
      if (item.user_id !== user?.id) {
        const map = mapRef.current;
        if (!map || !item.latitude || !item.longitude) return;

        closeAllPopups();

        const position = event?.latlng || L.latLng(item.latitude, item.longitude);
        const userIdToFetch = item.user_id; // Store userId before async call

        // Create and open popup with loading state immediately
        const loadingContent = '<div class="p-3 text-center text-gray-500 text-sm">Loading profile...</div>';
        const popup = L.popup({
          closeButton: true, // Use Leaflet's close button
          offset: [0, -15], // Align tip above marker anchor
          className: 'custom-leaflet-popup user-profile-static-wrapper', // New class
          minWidth: 320, // Match content width
        })
          .setLatLng(position)
          .setContent(loadingContent)
          .openOn(map);

        // Store ref to this popup
        userInfoPopupRef.current = popup;

        // --- Fetch profile data and update popup content ---
        const fetchAndRenderProfile = async () => {
          try {
            const { data: profileData, error: fetchError } = await supabase
              .from('profiles')
              // Add home_latitude and home_longitude to the select query
              .select('id, name, age, gender, languages, cuisines, budget, bio, avatar_url, created_at, home_latitude, home_longitude')
              .eq('id', userIdToFetch)
              .single();

            if (!popup.isOpen()) return; // Check if popup is still open using public method

            if (fetchError) {
              throw fetchError;
            }

            if (profileData) {
              // Calculate derived status based on fetched home location and clicked item's location
              let derivedStatus: 'Local' | 'Traveller' | null = null;
              const homeLat = profileData.home_latitude;
              const homeLng = profileData.home_longitude;
              const currentLat = item.latitude; // Use the location from the clicked item
              const currentLng = item.longitude;
              const LOCAL_THRESHOLD_KM = 50; // Same threshold as in useMapData

              if (homeLat != null && homeLng != null && currentLat != null && currentLng != null) {
                  // Use the existing utility function (already imported)
                  const distance = calculateHaversineDistance(currentLat, currentLng, homeLat, homeLng);
                  derivedStatus = distance <= LOCAL_THRESHOLD_KM ? 'Local' : 'Traveller';
              } else {
                  derivedStatus = 'Traveller'; // Default if home location isn't set
              }

              // Add default values and the calculated status
              const enhancedProfile = {
                ...profileData,
                travel_status: derivedStatus, // Use the calculated status
              };

              // Create unique functions for this popup instance
              const handleAvatarClick = () => {
                if (enhancedProfile.avatar_url) {
                  setCurrentModalImage(enhancedProfile.avatar_url);
                  setIsImageModalOpen(true);
                }
              };

              // Create a wrapper for the component that includes the click handler
              const ProfileWithHandlers = () => (
                <UserProfilePopupContent 
                  profile={enhancedProfile}
                  onAvatarClick={handleAvatarClick} 
                />
              );
              
              // Render to string
              const profileHtml = ReactDOMServer.renderToString(<ProfileWithHandlers />);
              
              // Set popup content
              popup.setContent(profileHtml);
              
              // Improved avatar click handler implementation
              setTimeout(() => {
                if (popup.isOpen()) {
                  const avatarElement = popup.getElement()?.querySelector('.avatar-upload-container') as HTMLElement | null; // Cast to HTMLElement
                  if (avatarElement && enhancedProfile.avatar_url) {
                    // Type guard to ensure avatarElement is not null and has onclick/style
                    if (avatarElement) {
                        avatarElement.onclick = (e: MouseEvent) => { // Add type for event
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentModalImage(enhancedProfile.avatar_url);
                            setIsImageModalOpen(true);
                        };
                        avatarElement.style.cursor = 'pointer';
                    }
                  }
                }
              }, 100);
            } else {
              popup.setContent('<div class="p-3 text-center text-red-600 text-sm">Profile not found.</div>');
            }
          } catch (err: any) {
             if (!popup.isOpen()) return; // Check if popup is still open using public method
             console.error('Error fetching/rendering profile popup:', err);
             popup.setContent(`<div class="p-3 text-center text-red-600 text-sm">Error: ${err.message || 'Failed to load profile.'}</div>`);
          }
        };

        fetchAndRenderProfile(); // Fire off the async fetch/render

        // Stop event propagation *after* creating the popup
        if (event && event.originalEvent) {
          L.DomEvent.stopPropagation(event.originalEvent);
        }
        // --- End of new logic ---
      }
      // If it IS the current user, do nothing here (handled by UserLocationMarker)
    }
  }, [handleMarkerClick, closeAllPopups, mapZoom, user?.id, mapRef, userInfoPopupRef]); // Updated dependencies

  const handleAggregateTileClick = useCallback((items: (City | MapUser)[], markerPosition: L.LatLng) => {
    const map = mapRef.current;
    if (!map) return;

    closeAllPopups();

    const container = L.DomUtil.create('div', 'tile-list-popup-react-container');

    const popup = L.popup({
      closeButton: true,
      offset: [0, -15],
      className: 'custom-leaflet-popup tile-list-popup-leaflet-wrapper',
      minWidth: 400,
    })
      .setLatLng(markerPosition)
      .setContent(container)
      .openOn(map);

    let root: ReturnType<typeof createRoot> | null = null;
    try {
      root = createRoot(container);
      root.render(
        <React.StrictMode>
          <TileListPopup
            items={items}
            onUserClick={(userId) => {
              // User clicks now do nothing, as requested
            }}
          />
        </React.StrictMode>
      );
    } catch (error) {
      console.error('[handleAggregateTileClick] Error during immediate React render:', error);
      popup.remove();
      return;
    }

    popup.on('remove', () => {
      if (root) {
        // Defer unmounting to avoid synchronous unmount during render
        const currentRoot = root; // Capture root in closure
        setTimeout(() => {
            currentRoot.unmount();
        }, 0);
        root = null;
      }
      
      if (openPopupData?.type === 'aggregate' && openPopupData.ref === aggregatePopupRef) {
         setOpenPopupData(null);
      }
      
      if (aggregatePopupRef.current === popup) {
         aggregatePopupRef.current = null;
      }
    });

    aggregatePopupRef.current = popup;
    setOpenPopupData({ 
      type: 'aggregate', 
      items, 
      center: markerPosition,
      ref: aggregatePopupRef 
    });
  }, [closeAllPopups]);

  const filteredStats = useMemo(() => {
      if (!userCoordinates || !filters.distance || filters.distance >= 500) return null;
      const totalCities = cities.length;
      const visibleCities = filteredCities.length;
      if (totalCities === 0) return { totalCities: 0, visibleCities: 0, percentage: 0 };
      return { totalCities, visibleCities, percentage: Math.round((visibleCities / totalCities) * 100) };
  }, [userCoordinates, filters.distance, filteredCities, cities]);

  const allUsersForDisplay = useMemo(() => {
    const users = [...filteredUsers];
    if (mapZoom < 14 && user && userCoordinates) {
      const currentUserMapUser: MapUser = {
        user_id: user.id,
        name: "Your Location",
        latitude: userCoordinates[0],
        longitude: userCoordinates[1]
      };
      if (!users.some(u => u.user_id === currentUserMapUser.user_id)) {
        users.push(currentUserMapUser);
      }
    }
    return users;
  }, [filteredUsers, user, userCoordinates, mapZoom]);

  const tileAggregationData = useMapTilingData(
    filteredCities,
    allUsersForDisplay,
    user?.id ?? null
  );

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

  const markersForClustering = useMemo((): MarkerDefinition[] => {
    const markers: MarkerDefinition[] = [];
    const currentUserLatLng = userCoordinates ? L.latLng(userCoordinates[0], userCoordinates[1]) : null;

    tileAggregationData.forEach((tileData, tileId) => {
      try {
        const tileCenter = getTileCenterLatLng(tileId);
        let finalPosition = tileCenter;

        if (currentUserLatLng && distanceRadius !== null && tileData.items.length > 0) {
          const isAnyItemInsideRadius = tileData.items.some(item => {
            if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
                return false;
            }
            const itemLatLng = L.latLng(item.latitude, item.longitude);
            const distanceToItem = calculateHaversineDistance(
              currentUserLatLng.lat, currentUserLatLng.lng,
              itemLatLng.lat, itemLatLng.lng
            );
            return distanceToItem <= distanceRadius;
          });

          if (isAnyItemInsideRadius) {
            const distanceToTileCenter = calculateHaversineDistance(
              currentUserLatLng.lat, currentUserLatLng.lng,
              tileCenter.lat, tileCenter.lng
            );

            if (distanceToTileCenter > distanceRadius) {
              finalPosition = calculateBorderPoint(currentUserLatLng, tileCenter, distanceRadius);
            }
          }
        }

        tileData.items.forEach(item => {
          if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
             console.warn('Item missing coordinates during transformation, skipping:', item);
             return;
          }

          const markerDef: MarkerDefinition = {
            id: 'population' in item ? `city-${item.id}` : `user-${item.user_id}`,
            latitude: finalPosition.lat,
            longitude: finalPosition.lng,
            type: 'population' in item ? 'city' : 'user',
            name: item.name,
            userId: 'user_id' in item ? item.user_id : null,
            population: 'population' in item ? item.population : undefined,
            originalItem: item
          };
          markers.push(markerDef);
        });
      } catch (error) {
          console.error(`Error processing tile ${tileId}:`, error);
      }
    });
    return markers;
  }, [tileAggregationData, userCoordinates, distanceRadius]);

  useEffect(() => {
    const handleResize = () => { if (mapRef.current) { mapRef.current.invalidateSize(); } };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => handleResize(), 100);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 350);

    return () => clearTimeout(timer);
  }, []); // Removed isSidebarCollapsed from dependencies

  useEffect(() => {
    if (!openPopupData || !mapRef.current) return;

    const map = mapRef.current;
    const currentPopupRef = openPopupData.ref;

    if (openPopupData.type === 'user') {
      const userStillVisible = filteredUsers.some(u => u.user_id === openPopupData.user.user_id);
      if (!userStillVisible) {
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
        setOpenPopupData(null);
      }
    } else if (openPopupData.type === 'aggregate') {
      const tileId = getTileId(openPopupData.center.lat, openPopupData.center.lng);
      const updatedTileData = tileAggregationData.get(tileId);

      if (updatedTileData && updatedTileData.items.length > 0) {
        setOpenPopupData(prev => {
          if (prev && prev.type === 'aggregate') {
            const oldItems = prev.items;
            const newItems = updatedTileData.items;
            const oldIds = oldItems.map(item => 'population' in item ? `c-${item.id}` : `u-${item.user_id}`).sort();
            const newIds = newItems.map(item => 'population' in item ? `c-${item.id}` : `u-${item.user_id}`).sort();

            if (oldIds.join(',') !== newIds.join(',')) {
              return { ...prev, items: newItems };
            }
            return prev;
          }
          return null;
        });
      } else {
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
        setOpenPopupData(null);
      }
    }
  }, [filteredUsers, tileAggregationData, openPopupData, mapRef]);

  const RadiusCircle = useCallback(() => {
      if (!userCoordinates || !distanceRadius || distanceRadius <= 0 || distanceRadius >= 500) return null;
      return (<Circle center={userCoordinates} radius={distanceRadius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />);
  }, [userCoordinates, distanceRadius]);

  const isLoading = authLoading || mapDataLoading || loadingOtherUsers;
  if (isLoading) {
    return ( <div className="flex items-center justify-center h-full w-full bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div> );
  }

  if (!user) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <BlurredBackgroundMap />
        <div className="relative z-10 flex items-center justify-center h-full w-full text-center p-8 bg-gray-800 bg-opacity-50">
          <div className="max-w-md bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Unlock the Full Map Experience!</h2>
            <p className="text-gray-600 mb-6">
              Log in or create an account to view the interactive map, discover culinary spots, and save your favorites.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => openAuthModal('login')} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">Log In</Button>
              <Button onClick={() => openAuthModal('register')} className="border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500">Sign Up</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (locationPermissionStatus !== 'granted') {
    let message = "To use location-based features like distance filtering and seeing your position, please grant location access.";
    if (locationPermissionStatus === 'denied') { message = "It looks like location access was denied. We need your location to show relevant information based on proximity. Please grant permission to continue."; }
    else if (locationPermissionStatus === 'unavailable') { message = "We couldn't access your location. This might be because your browser doesn't support it, or there was an issue retrieving it. Please ensure location services are enabled on your device and try again."; }
    const additionalGuidance = "If you previously denied permission and don't see a prompt, please check your browser's site settings for this website and allow location access.";
    return (
      <div className="relative h-full w-full overflow-hidden">
        <BlurredBackgroundMap />
        <div className="relative z-10 flex items-center justify-center h-full w-full text-center p-8 bg-gray-800 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Location Access Required</h2>
            <p className="text-gray-600 mb-4 text-left">{message}</p>
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

  const dataError = mapDataError || errorOtherUsers;
  if (dataError) {
    const errorMessage = mapDataError ? `Fehler beim Laden der Städtedaten: ${mapDataError}` : `Fehler beim Laden der Benutzerstandorte: ${errorOtherUsers}`;
    return ( <div className="flex items-center justify-center h-full w-full"><div className="text-red-500 max-w-md p-4 bg-red-50 rounded-lg border border-red-100"><h2 className="text-xl font-bold mb-2">Fehler beim Laden der Kartendaten</h2><p>{errorMessage}</p><button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Neu laden</button></div></div> );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row flex-grow w-full">
        <Sidebar
          cities={filteredCities}
          users={filteredUsers}
          onCitySelect={handleCitySelect}
          onCountryFilter={filterByCountry}
          onPopulationFilter={filterByPopulation}
          onDistanceFilter={handleDistanceFilter}
          // User Filter Props
          onAgeFilter={filterByAge}
          onGenderFilter={filterByGender}
          onLanguagesFilter={filterByLanguages}
          onCuisinesFilter={filterByCuisines}
          onBudgetFilter={filterByBudget}
          currentAgeFilter={filters.age}
          currentGenderFilter={filters.gender}
          currentLanguagesFilter={filters.languages}
          currentCuisinesFilter={filters.cuisines}
          currentBudgetFilter={filters.budget}
          onTravelStatusFilter={filterByLocalStatus} // Pass the function down
          currentTravelStatusFilter={filters.localStatus} // Pass the current state down
          // ---
          onResetFilters={handleResetFilters}
          loading={mapDataLoading || loadingOtherUsers}
          userPosition={userCoordinates}
          filteredStats={filteredStats}
          currentDistanceFilter={filters.distance}
          isLocationLoading={isFetchingLocation}
          // Removed user filter props
        />
        <div className="flex-grow relative overflow-hidden">
          <MapContainer
            center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}
            zoomControl={false} ref={mapRef} maxBoundsViscosity={1.0} worldCopyJump={false}
            bounceAtZoomLimits={true} minZoom={2} maxZoom={14}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <ZoomControl position="bottomright" />
            <MapBoundsController />
            <MapEventHandlers onZoomEnd={throttledHandleZoom} onMoveEnd={debouncedHandleMapMove} onMapClick={handleMapClick} />

            {mapZoom < 14 ? (
              <MarkerCluster
                markersData={markersForClustering}
                onItemClick={handleItemClick}
                activeCityId={clickedCity?.id ?? null}
                currentUserId={user?.id ?? null}
                userCoordinates={userCoordinates}
              />
            ) : (
              <TileAggregateLayer
                tileAggregationData={tileAggregationData}
                onItemClick={handleItemClick}
                onAggregateTileClick={handleAggregateTileClick}
                currentUserId={user?.id ?? null}
                currentUserLocation={userCoordinates ? L.latLng(userCoordinates[0], userCoordinates[1]) : null}
                distanceRadius={distanceRadius}
              />
            )}

            {clickedCity && (
              <InfoPopup city={clickedCity} onClose={handlePopupClose} />
            )}

            {userCoordinates && mapZoom >= 14 && (
              <UserLocationMarker
                position={userCoordinates}
                onClick={handleUserMarkerClick}
              />
            )}

            <RadiusCircle />
          </MapContainer>

          <div className="absolute top-4 right-4 z-[999] flex flex-col space-y-2">
            {userCoordinates && (
              <Button
                onClick={handleUserMarkerClick}
                className="bg-white hover:bg-gray-100 text-gray-700 text-sm py-1 px-2 border border-gray-300 rounded shadow"
                aria-label="Zoom to my location"
              >
                Zoom to Me
              </Button>
            )}
          </div>
        </div>
      </div>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={currentModalImage || ''}
      />
    </>
  );
};

export default WorldMap;
