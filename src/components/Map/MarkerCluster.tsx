import { useEffect } from 'react';
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
}

/**
 * Komponente zur Darstellung der Stadt-Marker mit Clustering
 */
const MarkerCluster = ({ cities, onMarkerClick }: MarkerClusterProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Entferne vorhandene Layer, um Duplikate zu vermeiden
    map.eachLayer((layer) => {
      if (layer instanceof L.MarkerClusterGroup) {
        map.removeLayer(layer);
      }
    });

    // Erstelle eine neue Marker-Cluster-Gruppe
    const markerClusterGroup = new L.MarkerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 10,
      iconCreateFunction: (cluster) => {
        const childCount = cluster.getChildCount();
        const size = childCount < 10 ? 'small' : childCount < 30 ? 'medium' : 'large';
        
        return new L.DivIcon({
          html: `<div><span>${childCount}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: new L.Point(40, 40)
        });
      }
    });

    // Füge Marker für jede Stadt hinzu
    cities.forEach((city) => {
      // Verwende SVG-basiertes Icon statt statisches Bild
      const markerIcon = createSvgMarkerIcon(city.population);
      
      const marker = L.marker([city.latitude, city.longitude], {
        icon: markerIcon,
        title: city.name
      });

      // Füge Tooltip hinzu
      marker.bindTooltip(`
        <div>
          <strong>${city.name}, ${city.country}</strong>
          <div>Bevölkerung: ${formatPopulation(city.population)}</div>
        </div>
      `);

      // Event-Handler für Klicks
      marker.on('click', () => {
        onMarkerClick(city);
      });

      markerClusterGroup.addLayer(marker);
    });

    // Füge die Marker-Cluster-Gruppe zur Karte hinzu
    map.addLayer(markerClusterGroup);

    // Cleanup-Funktion
    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map, cities, onMarkerClick]);

  return null; // Diese Komponente rendert kein sichtbares Element
};

export default MarkerCluster;
