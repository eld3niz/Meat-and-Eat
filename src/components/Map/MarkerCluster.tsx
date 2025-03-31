import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';
import createSvgMarkerIcon from './CityMarkerIcon';

// Vermeidung von Typdeklarationskonflikten durch das Entfernen der declare module-Sektion
// Stattdessen verwenden wir Typen aus dem @types/leaflet.markercluster Paket

interface MarkerClusterProps {
  cities: City[];
  onMarkerClick: (city: City) => void;
  onMarkerMouseOver: (city: City) => void; // Add mouseover handler prop
  onMarkerMouseOut: () => void; // Add mouseout handler prop
  activeCityId: number | null; // Add prop for currently clicked city ID
  onClusterClick: () => void; // Add prop for cluster click handler
}

/**
 * Komponente zur Darstellung der Stadt-Marker mit Clustering
 */
const MarkerCluster = ({ cities, onMarkerClick, onMarkerMouseOver, onMarkerMouseOut, activeCityId, onClusterClick }: MarkerClusterProps) => {
  const map = useMap();
  const markerClusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<{[id: number]: L.Marker}>({});
  
  // Verwende useMemo für die Markercluster-Gruppe, um unnötige Neuberechnung zu verhindern
  const markerClusterOptions = useMemo(() => ({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 10,
    maxClusterRadius: 80,
    zoomToBoundsOnClick: true,
    removeOutsideVisibleBounds: true,
    animate: window.innerWidth > 768,
    iconCreateFunction: (cluster: L.MarkerCluster) => {
      const childCount = cluster.getChildCount();
      const size = childCount < 10 ? 'small' : childCount < 30 ? 'medium' : 'large';
      
      return new L.DivIcon({
        html: `<div><span>${childCount}</span></div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: new L.Point(40, 40)
      });
    }
  }), []);

  // Initialisiere die Marker-Cluster-Gruppe
  useEffect(() => {
    if (!map) return;
    
    // Erstelle die Marker-Cluster-Gruppe nur einmal
    if (!markerClusterGroupRef.current) {
      markerClusterGroupRef.current = new L.MarkerClusterGroup(markerClusterOptions);
      map.addLayer(markerClusterGroupRef.current);

      // Add listener for cluster clicks
      const clusterGroup = markerClusterGroupRef.current;
      clusterGroup.on('clusterclick', onClusterClick);
    }
    
    // Cleanup function
    return () => {
      if (map && markerClusterGroupRef.current) {
        // Remove listener before removing layer
        markerClusterGroupRef.current.off('clusterclick', onClusterClick);
        map.removeLayer(markerClusterGroupRef.current);
        markerClusterGroupRef.current = null;
        markersRef.current = {};
      }
    };
  }, [map, markerClusterOptions, onClusterClick]); // Add onClusterClick to dependencies

  // Aktualisiere die Marker basierend auf den Städten
  useEffect(() => {
    if (!map || !markerClusterGroupRef.current) return;
    
    const currentMarkerGroup = markerClusterGroupRef.current;
    const currentMarkers = markersRef.current;
    const currentMarkerIds = Object.keys(currentMarkers).map(Number);
    const newCityIds = cities.map(city => city.id);
    
    // Entferne Marker, die nicht mehr in den Städten enthalten sind
    const markersToRemove = currentMarkerIds.filter(id => !newCityIds.includes(id));
    markersToRemove.forEach(id => {
      if (currentMarkers[id]) {
        currentMarkerGroup.removeLayer(currentMarkers[id]);
        delete currentMarkers[id];
      }
    });
    
    // Wenn cities leer ist und ein Entfernungsfilter aktiv ist (keine Städte in Reichweite),
    // dann alle Marker entfernen und nichts hinzufügen
    if (cities.length === 0) {
      currentMarkerIds.forEach(id => {
        if (currentMarkers[id]) {
          currentMarkerGroup.removeLayer(currentMarkers[id]);
          delete currentMarkers[id];
        }
      });
      return;
    }

    // Füge neue Marker hinzu oder aktualisiere bestehende
    const markersToAdd: L.Marker[] = [];
    
    cities.forEach(city => {
      // Wenn der Marker bereits existiert, überspringe ihn
      if (currentMarkers[city.id]) return;
      
      // Erstelle einen neuen Marker
      const marker = L.marker([city.latitude, city.longitude], {
        icon: createSvgMarkerIcon(city.population)
      });
      
      // Event-Listener hinzufügen
      marker.on('click', () => {
        onMarkerClick(city);
      });
      marker.on('mouseover', () => { // Add mouseover listener
        // Only trigger hover if no city popup is currently active
        if (activeCityId === null) {
          onMarkerMouseOver(city);
        }
      });
      marker.on('mouseout', () => { // Add mouseout listener
        onMarkerMouseOut();
      });
      
      // Popup-Inhalte nur bei Bedarf generieren
      marker.bindTooltip(city.name, { 
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      });
      
      // Speichere den neuen Marker in der Referenz
      currentMarkers[city.id] = marker;
      markersToAdd.push(marker);
    });
    
    // Füge neue Marker in Batches hinzu, um UI-Blockierung zu vermeiden
    if (markersToAdd.length > 0) {
      requestAnimationFrame(() => {
        currentMarkerGroup.addLayers(markersToAdd);
      });
    }
    
  }, [map, cities, onMarkerClick, onMarkerMouseOver, onMarkerMouseOut]); // Add hover handlers to dependencies

  return null;
};

export default MarkerCluster;
