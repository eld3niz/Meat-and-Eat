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
import L from 'leaflet';
import { calculateDistance, calculateHaversineDistance, isCityWithinRadius, throttle, debounce } from '../../utils/mapUtils'; // Stellen Sie sicher, dass diese Funktion importiert wird

// Komponente zum Zentrieren der Karte memoizen
const MapCenterController = memo(({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
}); // Hier war der Fehler mit doppeltem Semikolon

// Verbesserte Komponente zur Konfiguration der Kartenbegrenzungen
const MapBoundsController = () => {
  const map = useMap();
  
  useEffect(() => {
    // Definiere die maximalen Grenzen der Karte (Weltkarte einmalig sichtbar)
    // Benutze -85 bis 85 für Latitude, weil Mercator-Projektionen nahe den Polen Verzerrungen haben
    const southWest = L.latLng(-85, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    
    // Setze die maximalen Begrenzungen der Karte mit maximaler "Klebrigkeit"
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;
    
    // Setze eine minimale Zoom-Stufe, um zu vermeiden dass mehrere Weltkarten sichtbar sind
    map.setMinZoom(2);
    
    // Verhindere, dass die Karte über ihre Grenzen hinaus bewegt werden kann
    map.on('drag', function() {
      map.panInsideBounds(bounds, { animate: false });
    });
    
    // Korrigiere Weltkartenwiederholungen an den Rändern
    // @ts-ignore - CRS.wrapLng ist in den Typ-Definitionen nicht vollständig
    if (map.options.crs && map.options.crs.wrapLng) {
      // @ts-ignore
      map.options.crs.wrapLng = [-180, 180]; // Begrenze die Longitude auf einen Bereich
    }

    // Beim Laden der Karte anpassen, um den gesamten verfügbaren Bereich zu nutzen
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  return null;
};

const WorldMap = () => {
  const { 
    loading, 
    error, 
    filteredCities, 
    selectCity, 
    filterByCountry,
    filterByPopulation,
    resetFilters,
    zoomToCity
  } = useMapData();
  
  const [clickedCity, setClickedCity] = useState<City | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState<number>(2);
  const mapRef = useRef<L.Map | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null); // Speichern der Benutzerposition
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // Neuer State für Entfernungsfilter
  const [filteredByDistance, setFilteredByDistance] = useState<City[]>([]); // Städte gefiltert nach Entfernung
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null);

  // Optimierter Callback für UserLocationMarker mit useCallback
  const handleUserPositionUpdate = useCallback((position: [number, number] | null) => {
    setUserPosition(position);
  }, []);

  // Stabiler Effekt für Entfernungsfilterung
  useEffect(() => {
    // Wenn kein Filter aktiv oder kein Standort vorhanden, zeige alle Städte
    if (!userPosition || distanceFilter === null) {
      setFilteredByDistance([]);
      return;
    }

    // Anwendung des Entfernungsfilters nur wenn beides vorhanden ist
    const citiesInRange = filteredCities.filter(city => {
      const distance = calculateDistance(
        { latitude: userPosition[0], longitude: userPosition[1] } as City,
        city
      );
      return distance <= distanceFilter;
    });

    setFilteredByDistance(citiesInRange);
  }, [userPosition, distanceFilter, filteredCities]);

  // Stabiler Callback für Standort-Toggle
  const handleToggleUserLocation = useCallback(() => {
    const newState = !showUserLocation;
    setShowUserLocation(newState);
    
    // Wenn der Standort deaktiviert wird, setze den Filter zurück
    if (!newState) {
      setDistanceFilter(null);
    }
  }, [showUserLocation]);

  // Optimierter Callback für Entfernungsfilter
  const handleDistanceFilter = useCallback((distance: number | null) => {
    // Setze Radius-Wert für Visualisierung auf der Karte
    setDistanceRadius(distance);
    // Setze Filter-Wert für die tatsächliche Filterung
    setDistanceFilter(distance);
  }, []);

  // Effiziente Filterung der Städte basierend auf Entfernung
  useEffect(() => {
    if (!userPosition || distanceFilter === null) {
      // Wenn kein Benutzerstandort oder kein Filter aktiv ist, alle Städte zeigen
      setFilteredByDistance([]);
      return;
    }

    // Performance-Optimierung: Nur innerhalb des useEffects filtern
    const [userLat, userLng] = userPosition;
    
    // Wende präzise Filterung an
    const citiesInRange = filteredCities.filter(city => 
      isCityWithinRadius(userLat, userLng, city, distanceFilter)
    );

    setFilteredByDistance(citiesInRange);
  }, [userPosition, distanceFilter, filteredCities]);

  // Visualisierung des Radius für den Benutzer
  const RadiusCircle = useCallback(() => {
    if (!userPosition || !distanceRadius || distanceRadius >= 200) return null;
    
    return (
      <Circle
        center={userPosition}
        radius={distanceRadius * 1000} // Umrechnung in Meter für Leaflet
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1,
        }}
      />
    );
  }, [userPosition, distanceRadius]);

  // Berechne statistische Informationen für die Sidebar
  const filteredStats = useMemo(() => {
    if (!userPosition || !distanceFilter || distanceFilter >= 200) return null;
    
    const totalCities = filteredCities.length;
    const visibleCities = filteredByDistance.length;
    
    return {
      totalCities,
      visibleCities,
      percentage: Math.round((visibleCities / totalCities) * 100)
    };
  }, [userPosition, distanceFilter, filteredCities, filteredByDistance]);

  const handleMarkerClick = (city: City) => {
    setClickedCity(city);
    setMapCenter([city.latitude, city.longitude]);
    setMapZoom(5);
  };

  const handlePopupClose = () => {
    setClickedCity(null);
  };

  const handleCitySelect = (cityId: number) => {
    const coords = zoomToCity(cityId);
    setMapCenter(coords);
    setMapZoom(7);
    selectCity(cityId);
    
    // Suche Stadt und setze als geklickte Stadt für Popup
    const city = filteredCities.find(c => c.id === cityId);
    if (city) {
      setClickedCity(city);
    }
  };

  // Gedrosselte Handler für Karteninteraktionen
  const throttledHandleZoom = useCallback(
    throttle(() => {
      if (mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        setMapZoom(currentZoom);
      }
    }, 100),
    []
  );
  
  const debouncedHandleMapMove = useCallback(
    debounce(() => {
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        setMapCenter([center.lat, center.lng]);
      }
    }, 150),
    []
  );
  
  // Optimierter Handler für MapMoveEnd-Event
  const handleMapMoveEnd = useCallback(() => {
    if (mapRef.current) {
      // Aktuellen Mittelpunkt und Zoom-Level speichern
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      // Hier können Sie weitere Logik implementieren
    }
  }, []);
  
  // Optimieren der displayedCities-Berechnung mit besserer Memoization
  const displayedCities = useMemo(() => {
    // Stellen Sie sicher, dass jede Stadt nur einmal im Array vorkommt (eindeutige IDs)
    const cityMap = new Map<number, City>();
    
    // Reduzieren Sie die Anzahl der gerenderten Städte bei hohem Zoom-Level
    if (mapZoom < 4) {
      // Bei Übersichtskarte nur Städte ab einer bestimmten Größe anzeigen
      const minPopulation = 5000000; // 5 Millionen Einwohner
      
      let citiesToFilter = filteredCities;
      if (distanceFilter !== null && userPosition && filteredByDistance.length > 0) {
        citiesToFilter = filteredByDistance;
      }
      
      citiesToFilter
        .filter(city => city.population >= minPopulation)
        .forEach(city => cityMap.set(city.id, city));
    } else {
      // Normale Filterung
      if (distanceFilter !== null && userPosition && filteredByDistance.length > 0) {
        filteredByDistance.forEach(city => cityMap.set(city.id, city));
      } else {
        filteredCities.forEach(city => cityMap.set(city.id, city));
      }
    }
    
    return Array.from(cityMap.values());
  }, [distanceFilter, userPosition, filteredByDistance, filteredCities, mapZoom]);
  
  // Aktualisiere die Karte bei Größenänderungen
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Behandlung von Ladefehlern
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 max-w-md p-4 bg-red-50 rounded-lg border border-red-100">
          <h2 className="text-xl font-bold mb-2">Fehler beim Laden der Karte</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] w-full">
        {/* Seitenleiste mit erweiterten Funktionen */}
        <Sidebar 
          cities={displayedCities}
          onCitySelect={handleCitySelect} 
          onCountryFilter={filterByCountry}
          onPopulationFilter={filterByPopulation}
          onDistanceFilter={handleDistanceFilter}
          onResetFilters={resetFilters}
          loading={loading}
          onToggleUserLocation={handleToggleUserLocation}
          showUserLocation={showUserLocation}
          userPosition={userPosition}
          filteredStats={filteredStats}
        />

        {/* Karte - nimmt den Rest des verfügbaren Platzes ein */}
        <div className="flex-grow relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500"></div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              ref={mapRef}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
              bounceAtZoomLimits={true}
              minZoom={2}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              <MapCenterController center={mapCenter} zoom={mapZoom} />
              <MapBoundsController />
              
              {/* Marker-Cluster mit optimierter Darstellung */}
              <MarkerCluster
                cities={displayedCities}
                onMarkerClick={handleMarkerClick}
              />
              
              {/* Popup für ausgewählte Stadt */}
              {clickedCity && (
                <InfoPopup
                  city={clickedCity}
                  position={[clickedCity.latitude, clickedCity.longitude]}
                  onClose={handlePopupClose}
                />
              )}
              
              {/* Benutzerposition anzeigen, wenn aktiviert */}
              {showUserLocation && userPosition && (
                <UserLocationMarker 
                  position={userPosition} 
                  radius={distanceRadius * 1000}
                  showRadius={distanceRadius > 0 && distanceRadius < 200}
                />
              )}
              
              {/* Für distanceRadius größer 0 aber kleiner 200 zeigen wir den Radius an */}
              {userPosition && distanceRadius > 0 && distanceRadius < 200 && (
                <RadiusCircle />
              )}
            </MapContainer>
          )}
        </div>
      </div>
      
      {/* City Table für die Listenansicht unterhalb der Karte */}
      <div className="overflow-y-auto mt-4 mb-8">
        <CityTable 
          cities={displayedCities} 
          userPosition={userPosition} 
        />
      </div>
    </div>
  );
};

export default WorldMap;
