import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapData } from '../../hooks/useMapData';
import MarkerCluster from './MarkerCluster';
import InfoPopup from './InfoPopup';
import UserLocationMarker from './UserLocationMarker';
import Sidebar from '../UI/Sidebar';
import CityTable from '../UI/CityTable';
import { City } from '../../types';
// Fix: Rename imported Map type from Leaflet to avoid collision
import L, { Map as LeafletMap } from 'leaflet';
import { calculateDistance, calculateHaversineDistance, isCityWithinRadius, throttle, debounce } from '../../utils/mapUtils';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../contexts/ModalContext'; // Import useModal
import Button from '../UI/Button'; // Import Button

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
  const { user, locationPermissionStatus, userCoordinates, loading: authLoading, requestLocationPermission } = useAuth(); // Added requestLocationPermission
  const { loading: mapDataLoading, error: mapDataError, filteredCities, selectCity, filterByCountry, filterByPopulation, resetFilters, zoomToCity } = useMapData();
  const { openAuthModal } = useModal(); // Get modal function
  const [clickedCity, setClickedCity] = useState<City | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null); // State for hover preview
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState<number>(2);
  // Fix: Use renamed LeafletMap type for ref
  const mapRef = useRef<LeafletMap | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [filteredByDistance, setFilteredByDistance] = useState<City[]>([]);
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null);
  const [isFlying, setIsFlying] = useState(false); // State to track map animation

  // --- Callbacks (Defined after state, before early returns) ---
  // Removed handleUserPositionUpdate as position comes from context
  const handleDistanceFilter = useCallback((distance: number | null) => { setDistanceRadius(distance); setDistanceFilter(distance); setClickedCity(null); }, []); // Close popup on filter change
  const handleMarkerClick = useCallback((city: City) => {
    const map = mapRef.current;
    if (!map || isFlying) return; // Prevent action if map not ready or already animating

    setIsFlying(true);
    setHoveredCity(null); // Clear hover state on click
    const targetCoords: [number, number] = [city.latitude, city.longitude];
    const currentZoom = map.getZoom();
    const minDetailZoom = 7; // Minimum zoom level to show detail without zooming out
    const targetZoom = Math.max(currentZoom, minDetailZoom); // Stay at current zoom or zoom in to minDetailZoom

    map.flyTo(targetCoords, targetZoom, { duration: 1.0 }); // Slightly faster animation

    // Update state after animation
    setTimeout(() => {
      setMapCenter(targetCoords);
      setMapZoom(targetZoom);
      setClickedCity(city); // Set clicked city *after* animation
      setIsFlying(false);
    }, 1000); // Match flyTo duration
  }, [isFlying]); // Add isFlying dependency

  const handlePopupClose = useCallback(() => { setClickedCity(null); }, []);

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
  }, [zoomToCity, selectCity, filteredCities, isFlying]); // Add dependencies
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
  }, 150), [isFlying, clickedCity]); // Add clickedCity dependency

  // Close clicked popup when clicking outside of it
  const handleMapClick = useCallback((event: L.LeafletMouseEvent) => {
    // Check if the click target is inside the InfoPopup container
    // We assume InfoPopup's root element has a specific class, e.g., 'info-popup-container'
    const targetElement = event.originalEvent.target as HTMLElement;
    if (targetElement.closest('.info-popup-container')) {
      return; // Click was inside the popup, do nothing
    }
    // If clickedCity is set and the click was outside, close it
    if (clickedCity) {
      setClickedCity(null);
    }
  }, [clickedCity]); // Dependency on clickedCity

  // Handlers for marker hover events
  const handleMarkerMouseOver = useCallback((city: City) => {
    if (!clickedCity) { // Only show hover if no city is actively clicked
      setHoveredCity(city);
    }
  }, [clickedCity]); // Dependency on clickedCity

  const handleMarkerMouseOut = useCallback(() => {
    setHoveredCity(null);
  }, []);

  // --- Memos (Defined after state, before early returns) ---
  const filteredStats = useMemo(() => {
      // Use userCoordinates from context
      if (!userCoordinates || !distanceFilter || distanceFilter >= 500) return null;
      const totalCities = filteredCities.length; const visibleCities = filteredByDistance.length;
      if (totalCities === 0) return { totalCities: 0, visibleCities: 0, percentage: 0 };
      return { totalCities, visibleCities, percentage: Math.round((visibleCities / totalCities) * 100) };
  }, [userCoordinates, distanceFilter, filteredCities, filteredByDistance]); // Update dependencies
  const displayedCities = useMemo(() => {
    // Fix: Use standard JS Map constructor
    const cityMap = new Map<number, City>();
    let sourceCities = filteredCities;
    // Use userCoordinates from context
    if (distanceFilter !== null && userCoordinates) { sourceCities = filteredByDistance; }
    if (mapZoom < 4) {
      const minPopulation = 5000000;
      sourceCities.filter(city => city.population >= minPopulation).forEach(city => cityMap.set(city.id, city));
    } else { sourceCities.forEach(city => cityMap.set(city.id, city)); }
    // Fix: Use cityMap.values() (should now work)
    // Explicitly type the result as City[] to be safe
    return Array.from(cityMap.values()) as City[];
  }, [distanceFilter, userCoordinates, filteredByDistance, filteredCities, mapZoom]); // Update dependencies

  // --- Effects (Defined after state, before early returns) ---
  useEffect(() => {
      // Use userCoordinates from context
      if (!userCoordinates || distanceFilter === null) { setFilteredByDistance([]); return; }
      const [userLat, userLng] = userCoordinates;
      const citiesInRange = filteredCities.filter(city => isCityWithinRadius(userLat, userLng, city, distanceFilter));
      setFilteredByDistance(citiesInRange);
  }, [userCoordinates, distanceFilter, filteredCities]); // Update dependencies
  useEffect(() => {
    const handleResize = () => { if (mapRef.current) { mapRef.current.invalidateSize(); } };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => handleResize(), 100);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timer); }
  }, []);
  const RadiusCircle = useCallback(() => {
      // Use userCoordinates from context
      if (!userCoordinates || !distanceRadius || distanceRadius >= 500) return null;
      return (<Circle center={userCoordinates} radius={distanceRadius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />);
  }, [userCoordinates, distanceRadius]); // Update dependencies


  // --- Conditional Returns (Now safe, as all hooks are defined above) ---
  if (authLoading || mapDataLoading) {
    return ( <div className="flex items-center justify-center h-full w-full bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div> );
  }

  // --- Case 1: User Not Logged In ---
  if (!user) {
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
              <Button
                onClick={openAuthModal}
                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
              >
                Log In
              </Button>
              <Button
                onClick={openAuthModal}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 2: Logged In, Location Permission Not Granted ---
  if (locationPermissionStatus !== 'granted') {
    // Logic adapted from LocationPermissionModal.tsx
    let message = "To use location-based features like distance filtering and seeing your position, please grant location access.";
    if (locationPermissionStatus === 'denied') {
      message = "It looks like location access was denied. We need your location to show relevant information based on proximity. Please grant permission to continue.";
    } else if (locationPermissionStatus === 'unavailable') {
      message = "We couldn't access your location. This might be because your browser doesn't support it, or there was an issue retrieving it. Please ensure location services are enabled on your device and try again.";
    }
    const additionalGuidance = "If you previously denied permission and don't see a prompt, please check your browser's site settings for this website and allow location access.";

    return (
      <div className="relative h-full w-full overflow-hidden"> {/* Parent container */}
        <BlurredBackgroundMap /> {/* Background */}
        <div className="relative z-10 flex items-center justify-center h-full w-full text-center p-8 bg-gray-800 bg-opacity-50"> {/* Foreground with semi-transparent overlay */}
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"> {/* Inner content box */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Location Access Required</h2>
            <p className="text-gray-600 mb-4 text-left">{message}</p> {/* Align text left */}
            {locationPermissionStatus === 'denied' && (
              <p className="text-sm text-gray-500 mb-6 text-left">{additionalGuidance}</p>
            )}
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
  if (mapDataError) {
    return ( <div className="flex items-center justify-center h-full w-full"><div className="text-red-500 max-w-md p-4 bg-red-50 rounded-lg border border-red-100"><h2 className="text-xl font-bold mb-2">Fehler beim Laden der Kartendaten</h2><p>{mapDataError}</p><button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Neu laden</button></div></div> );
  }

  // --- Render Map and UI (Only if logged in, permission granted, no errors) ---
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full">
        {/* Sidebar */}
        <Sidebar
          // Fix: displayedCities should now be City[]
          cities={displayedCities}
          onCitySelect={handleCitySelect}
          onCountryFilter={filterByCountry}
          onPopulationFilter={filterByPopulation}
          onDistanceFilter={handleDistanceFilter}
          onResetFilters={resetFilters}
          loading={mapDataLoading}
          // Pass userCoordinates from context
          userPosition={userCoordinates}
          filteredStats={filteredStats}
        />
        {/* Map Area */}
        <div className="flex-grow relative overflow-hidden">
          <MapContainer
            center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}
            zoomControl={false} ref={mapRef} maxBoundsViscosity={1.0} worldCopyJump={false}
            bounceAtZoomLimits={true} minZoom={2}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ZoomControl position="bottomright" />
            {/* Removed MapCenterController usage */}
            <MapBoundsController />
            <MapEventHandlers onZoomEnd={throttledHandleZoom} onMoveEnd={debouncedHandleMapMove} onMapClick={handleMapClick} />
            <MarkerCluster
              // Fix: displayedCities should now be City[]
              cities={displayedCities}
              onMarkerClick={handleMarkerClick}
              onMarkerMouseOver={handleMarkerMouseOver} // Pass hover handler
              onMarkerMouseOut={handleMarkerMouseOut}   // Pass hover handler
              activeCityId={clickedCity?.id ?? null} // Pass ID of clicked city
            />
            {/* Render clicked popup OR hover popup (if no city is clicked) */}
            {clickedCity ? (
              <InfoPopup city={clickedCity} onClose={handlePopupClose} />
            ) : hoveredCity ? (
              <InfoPopup city={hoveredCity} isHoverPreview={true} /> // Add isHoverPreview prop
            ) : null}
            {/* Pass userCoordinates from context, remove onPositionUpdate */}
            <UserLocationMarker position={userCoordinates} radius={distanceRadius ?? undefined} showRadius={false} />
            <RadiusCircle />
          </MapContainer>
        </div>
      </div>
      {/* City Table */}
      <div className="overflow-y-auto mt-4 mb-8 px-4">
        <CityTable
          // Fix: displayedCities should now be City[]
          cities={displayedCities}
          // Pass userCoordinates from context
          userPosition={userCoordinates}
        />
      </div>
    </div>
  );
};

export default WorldMap;
