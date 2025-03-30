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
const MapCenterController = memo(({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => { if (center && zoom) map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
});
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
const MapEventHandlers = ({ onZoomEnd, onMoveEnd }: { onZoomEnd: () => void, onMoveEnd: () => void }) => {
  const map = useMap();
  useEffect(() => {
    map.on('zoomend', onZoomEnd); map.on('moveend', onMoveEnd);
    return () => { map.off('zoomend', onZoomEnd); map.off('moveend', onMoveEnd); };
  }, [map, onZoomEnd, onMoveEnd]);
  return null;
};

// --- Main WorldMap Component ---
const WorldMap = () => {
  // --- Hooks (MUST be called unconditionally at the top) ---
  // Get userCoordinates from context
  const { user, locationPermissionStatus, userCoordinates, loading: authLoading } = useAuth();
  const { loading: mapDataLoading, error: mapDataError, filteredCities, selectCity, filterByCountry, filterByPopulation, resetFilters, zoomToCity } = useMapData();
  const { openAuthModal } = useModal(); // Get modal function
  const [clickedCity, setClickedCity] = useState<City | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState<number>(2);
  // Fix: Use renamed LeafletMap type for ref
  const mapRef = useRef<LeafletMap | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [filteredByDistance, setFilteredByDistance] = useState<City[]>([]);
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null);

  // --- Callbacks (Defined after state, before early returns) ---
  // Removed handleUserPositionUpdate as position comes from context
  const handleDistanceFilter = useCallback((distance: number | null) => { setDistanceRadius(distance); setDistanceFilter(distance); }, []);
  const handleMarkerClick = useCallback((city: City) => { setClickedCity(city); setMapCenter([city.latitude, city.longitude]); setMapZoom(5); }, []);
  const handlePopupClose = useCallback(() => { setClickedCity(null); }, []);
  const handleCitySelect = useCallback((cityId: number) => {
      const coords = zoomToCity(cityId);
      if (coords) {
          setMapCenter(coords); setMapZoom(7); selectCity(cityId);
          const city = filteredCities.find(c => c.id === cityId);
          if (city) { setClickedCity(city); }
      }
  }, [zoomToCity, selectCity, filteredCities]); // Add dependencies
  const throttledHandleZoom = useCallback(throttle(() => { if (mapRef.current) { setMapZoom(mapRef.current.getZoom()); } }, 100), []);
  const debouncedHandleMapMove = useCallback(debounce(() => { if (mapRef.current) { const c = mapRef.current.getCenter(); setMapCenter([c.lat, c.lng]); } }, 150), []);

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
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full w-full text-center p-8 bg-gray-50">
        <div className="max-w-md">
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
    );
  }
  if (locationPermissionStatus !== 'granted') { return null; }
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
            <MapCenterController center={mapCenter} zoom={mapZoom} />
            <MapBoundsController />
            <MapEventHandlers onZoomEnd={throttledHandleZoom} onMoveEnd={debouncedHandleMapMove} />
            <MarkerCluster
              // Fix: displayedCities should now be City[]
              cities={displayedCities}
              onMarkerClick={handleMarkerClick}
            />
            {clickedCity && ( <InfoPopup city={clickedCity} onClose={handlePopupClose} /> )}
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
