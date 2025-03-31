import L from 'leaflet';

/**
 * Erzeugt ein SVG-basiertes Marker-Icon für Städte
 * @param population Die Bevölkerungszahl der Stadt
 * @param color Die Farbe des Markers (optional)
 * @returns Ein Leaflet-Icon
 */
export const createSvgMarkerIcon = (population: number, color = '#1d4ed8'): L.DivIcon => {
  // Berechne Größe basierend auf der Bevölkerung
  const size = population > 20000000 ? 30 :
              population > 10000000 ? 25 :
              population > 5000000 ? 20 : 16;
  
  // Erstelle ein SVG als String mit äußerem Ring für bessere Sichtbarkeit
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}" fill-opacity="0.3"/> {/* Äußerer Ring */}
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1.5}" fill="${color}" stroke="white" stroke-width="1"/> {/* Innerer Kreis */}
    </svg>
  `;
  
  // HTML für den DivIcon
  const html = `
    <div style="width: ${size}px; height: ${size}px;">
      ${svgString}
    </div>
  `;
  
  // Erstelle das DivIcon
  return L.divIcon({
    html,
    className: 'city-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

export default createSvgMarkerIcon;
