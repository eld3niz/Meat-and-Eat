import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapData } from '../../hooks/useMapData';
import MarkerCluster from './MarkerCluster';
import InfoPopup from './InfoPopup';
import UserLocationMarker from './UserLocationMarker';
import Sidebar from '../UI/Sidebar';
import { City } from '../../types';
import L from 'leaflet';
import { calculateDistance, calculateHaversineDistance, isCityWithinRadius } from '../../utils/mapUtils'; // Stellen Sie sicher, dass diese Funktion importiert wird

// Komponente zum Zentrieren der Karte auf einen bestimmten Punkt
const MapCenterController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  
  return null;
};

// Komponente zur Konfiguration der Kartenbegrenzungen
const MapBoundsController = () => {
  const map = useMap();
  
  useEffect(() => {
    // Definiere die maximalen Grenzen der Karte (Weltkarte einmalig sichtbar)
    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    
    // Setze die maximalen Begrenzungen der Karte
    map.setMaxBounds(bounds);
    
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

  // Berechne die anzuzeigenden Städte: entweder gefiltert nach Entfernung oder alle
  const displayedCities = useMemo(() => {
    if (distanceFilter !== null && userPosition && filteredByDistance.length > 0) {
      return filteredByDistance;
    }
    return filteredCities;
  }, [distanceFilter, userPosition, filteredByDistance, filteredCities]);

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
        filteredStats={filteredStats} // Neue Prop für Statistik-Informationen
      />

      {/* Karte - nimmt den Rest des verfügbaren Platzes ein */}
      <div className="flex-grow relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Karte wird geladen...</p>
            </div>
          </div>
        ) : null}

        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false} 
          ref={mapRef} 
          maxBounds={[[-90, -180], [90, 180]]} 
          minZoom={2} 
          maxZoom={18} 
          worldCopyJump={false} 
          bounceAtZoomLimits={true} 
          style={{ width: "100%", height: "100%" }} 
          attributionControl={false} 
        >
          <TileLayer
            attribution="" 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={true} 
          />
          
          {/* Zoom-Kontrolle in die obere rechte Ecke verschieben */}
          <ZoomControl position="topright" />
          
          {/* Controller zum Ändern des Kartenzentrums */}
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          
          {/* Controller für Kartenbegrenzungen */}
          <MapBoundsController />
          
          {/* Visualisierung des Radius */}
          <RadiusCircle />
          
          {/* Marker mit Clustering */}
          <MarkerCluster 
            cities={displayedCities}
            onMarkerClick={handleMarkerClick} 
          />
          
          {/* Benutzerstandort anzeigen, wenn aktiviert */}
          {showUserLocation && <UserLocationMarker onPositionUpdate={handleUserPositionUpdate} />}
          
          {/* Info-Popup für ausgewählte Stadt */}
          {clickedCity && (
            <InfoPopup 
              city={clickedCity} 
              onClose={handlePopupClose} 
            />
          )}
        </MapContainer>
        
        {/* Distanz-Legende, wenn aktiv */}
        {distanceRadius && distanceRadius < 200 && userPosition && (
          <div className="absolute bottom-4 left-4 z-50 bg-white px-3 py-2 rounded-md shadow-md text-xs text-gray-700 border border-gray-200">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 bg-opacity-30 border border-blue-500 mr-2"></div>
              <span>Suchradius: {distanceRadius} km</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldMap;
