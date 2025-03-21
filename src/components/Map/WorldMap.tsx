import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useMapData } from '../../hooks/useMapData';
import MarkerCluster from './MarkerCluster';
import InfoPopup from './InfoPopup';
import Sidebar from '../UI/Sidebar';
import { City } from '../../types';
import L from 'leaflet';

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
        cities={filteredCities} 
        onCitySelect={handleCitySelect} 
        onCountryFilter={filterByCountry}
        onPopulationFilter={filterByPopulation}
        onResetFilters={resetFilters}
        loading={loading}
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
          zoomControl={false} // Wir positionieren die Zoom-Kontrolle manuell
          whenCreated={(map) => { mapRef.current = map; }}
          maxBounds={[[-90, -180], [90, 180]]} // Setze die maximalen Grenzen der Karte
          minZoom={2} // Setze minimale Zoom-Stufe
          maxZoom={18} // Setze maximale Zoom-Stufe
          worldCopyJump={false} // Deaktiviere weltweites Kopieren der Karte
          bounceAtZoomLimits={true} // Bounce-Effekt bei Erreichen der Zoom-Grenzen
          noWrap={true} // Verhindere, dass die Karte an den Rändern wiederholt wird
          style={{ width: "100%", height: "100%" }} // Stellt sicher, dass die Karte den verfügbaren Platz füllt
          attributionControl={false} // Entferne die Attributionssteuerung
        >
          <TileLayer
            attribution="" // Leere Attribution entfernt die Informationsbox
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            noWrap={true} // Verhindere, dass die Kacheln wiederholt werden
          />
          
          {/* Zoom-Kontrolle in die obere rechte Ecke verschieben */}
          <ZoomControl position="topright" />
          
          {/* Controller zum Ändern des Kartenzentrums */}
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          
          {/* Controller für Kartenbegrenzungen */}
          <MapBoundsController />
          
          {/* Marker mit Clustering */}
          <MarkerCluster 
            cities={filteredCities} 
            onMarkerClick={handleMarkerClick} 
          />
          
          {/* Info-Popup für ausgewählte Stadt */}
          {clickedCity && (
            <InfoPopup 
              city={clickedCity} 
              onClose={handlePopupClose} 
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default WorldMap;
