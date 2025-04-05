import { City } from '../types';
import L from 'leaflet';

/**
 * Formatiert eine Bevölkerungszahl in lesbares Format
 * @param population Bevölkerung als Zahl
 * @returns Formatierte Bevölkerungszahl als String
 */
export const formatPopulation = (population: number): string => {
  return new Intl.NumberFormat('de-DE').format(population);
};

/**
 * Sortiert Städte nach Bevölkerungszahl in absteigender Reihenfolge
 * @param cities Array von Städten
 * @returns Sortiertes Array von Städten
 */
export const sortCitiesByPopulation = (cities: City[]): City[] => {
  return [...cities].sort((a, b) => b.population - a.population);
};

/**
 * Filtert Städte nach Land
 * @param cities Array von Städten
 * @param country Name des Landes
 * @returns Gefiltertes Array von Städten
 */
export const filterCitiesByCountry = (cities: City[], country: string): City[] => {
  return cities.filter(city => city.country === country);
};

/**
 * Erzeugt ein benutzerdefiniertes Marker-Icon basierend auf der Bevölkerungsgröße
 * @param population Bevölkerungszahl
 * @returns Leaflet Icon-Objekt
 */
export const createMarkerIcon = (population: number): L.Icon => {
  const size = population > 20000000 ? 30 :
              population > 10000000 ? 25 :
              population > 5000000 ? 20 : 15;
  
  return L.icon({
    iconUrl: `/assets/markers/city-marker.png`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
};

/**
 * Berechnet die Entfernung zwischen zwei Städten in Kilometern
 * @param city1 Erste Stadt
 * @param city2 Zweite Stadt
 * @returns Entfernung in Kilometern
 */
export const calculateDistance = (city1: City, city2: City): number => {
  const R = 6371; // Erdradius in Kilometern
  const dLat = deg2rad(city2.latitude - city1.latitude);
  const dLon = deg2rad(city2.longitude - city1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(city1.latitude)) * Math.cos(deg2rad(city2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance);
};

/**
 * Berechnet die Entfernung zwischen zwei Punkten in Kilometern
 * Präzisere Implementierung für die Entfernungsfilterung
 * 
 * @param lat1 Breitengrad des ersten Punktes
 * @param lon1 Längengrad des ersten Punktes
 * @param lat2 Breitengrad des zweiten Punktes
 * @param lon2 Längengrad des zweiten Punktes
 * @returns Entfernung in Kilometern
 */
export const calculateHaversineDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Erdradius in Kilometern
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // Exakter Wert ohne Rundung für präzise Filterung
};

/**
 * Überprüft, ob eine Stadt innerhalb eines bestimmten Radius vom Benutzerstandort liegt
 * 
 * @param userLat Breitengrad des Benutzerstandorts
 * @param userLng Längengrad des Benutzerstandorts
 * @param city Stadt zum Überprüfen
 * @param radius Radius in Kilometern
 * @returns true, wenn die Stadt innerhalb des Radius liegt
 */
export const isCityWithinRadius = (
  userLat: number,
  userLng: number,
  city: City,
  radius: number
): boolean => {
  const distance = calculateHaversineDistance(
    userLat, 
    userLng, 
    city.latitude, 
    city.longitude
  );
  
  return distance <= radius;
};

/**
 * Hilfsfunktion zur Umrechnung von Grad in Radian
 * @param deg Grad
 * @returns Radian
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Hilfsfunktion zur Umrechnung von Radian in Grad
 * @param rad Radian
 * @returns Grad
 */
const rad2deg = (rad: number): number => {
  return rad * (180 / Math.PI);
};

/**
 * Calculates the geographical point on the circumference of a circle.
 * Given a center point, a target point outside the circle, and a radius,
 * this function finds the point on the circle's edge that lies on the line
 * connecting the center and the target.
 *
 * @param center The center of the circle (user's location).
 * @param target The original target point (e.g., tile center) outside the circle.
 * @param radiusKm The radius of the circle in kilometers.
 * @returns The L.LatLng point on the circle's border.
 */
export const calculateBorderPoint = (
  center: L.LatLng,
  target: L.LatLng,
  radiusKm: number
): L.LatLng => {
  const lat1 = center.lat;
  const lon1 = center.lng;
  const lat2 = target.lat;
  const lon2 = target.lng;

  const distanceToTarget = calculateHaversineDistance(lat1, lon1, lat2, lon2);

  // If target is already inside or on the border, return target itself
  if (distanceToTarget <= radiusKm) {
    return target;
  }

  // Calculate bearing from center to target
  const phi1 = deg2rad(lat1);
  const lambda1 = deg2rad(lon1);
  const phi2 = deg2rad(lat2);
  const lambda2 = deg2rad(lon2);

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  const theta = Math.atan2(y, x); // Bearing in radians

  // Calculate destination point
  const R = 6371; // Earth radius in km
  // Use 99.9% of the radius for calculation to ensure point is visually inside/on border
  const effectiveRadiusKm = radiusKm * 0.999;
  const delta = effectiveRadiusKm / R; // Angular distance in radians

  const phiDest = Math.asin(Math.sin(phi1) * Math.cos(delta) +
                           Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
  const lambdaDest = lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
                                         Math.cos(delta) - Math.sin(phi1) * Math.sin(phiDest));

  const latDest = rad2deg(phiDest);
  const lonDest = rad2deg(lambdaDest);

  return L.latLng(latDest, lonDest);
};

// --- OSM Tile Calculation Utilities ---

/**
 * Converts latitude and longitude to OSM tile coordinates (x, y) for a given zoom level.
 * Based on https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Mathematics
 * @param lat Latitude in degrees
 * @param lon Longitude in degrees
 * @param zoom Zoom level
 * @returns Tile coordinates {x, y} (integers)
 */
export const latLonToTileXY = (lat: number, lon: number, zoom: number): { x: number; y: number } => {
  const latRad = deg2rad(lat);
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(((lon + 180) / 360) * n);
  const yTile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: xTile, y: yTile };
};

/**
 * Converts OSM tile coordinates (x, y) and zoom level to the latitude and longitude
 * of the North-West corner of the tile.
 * Based on https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Mathematics
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param zoom Zoom level
 * @returns Latitude and Longitude {lat, lon} of the NW corner
 */
export const tileXYToLatLon = (x: number, y: number, zoom: number): { lat: number; lon: number } => {
  const n = Math.pow(2, zoom);
  const lonDeg = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latDeg = latRad * (180 / Math.PI);
  return { lat: latDeg, lon: lonDeg };
};

/**
 * Generates a unique string ID for the tile containing the given coordinates at zoom level 14.
 * @param lat Latitude
 * @param lon Longitude
 * @returns Tile ID string (e.g., "14-x-y")
 */
export const getTileId = (lat: number, lon: number): string => {
  const zoom = 14;
  const { x, y } = latLonToTileXY(lat, lon, zoom);
  return `${zoom}-${x}-${y}`;
};

/**
 * Calculates the center latitude and longitude of a given tile ID.
 * @param tileId Tile ID string (e.g., "14-x-y")
 * @returns Leaflet LatLng object representing the tile center.
 */
export const getTileCenterLatLng = (tileId: string): L.LatLng => {
  const parts = tileId.split('-');
  if (parts.length !== 3) {
    console.error(`Invalid tileId format: ${tileId}`);
    // Return a default or throw an error
    return L.latLng(0, 0); // Default fallback
  }
  const zoom = parseInt(parts[0], 10);
  const x = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);

  if (isNaN(zoom) || isNaN(x) || isNaN(y)) {
     console.error(`Invalid tileId components: ${tileId}`);
     return L.latLng(0, 0); // Default fallback
  }

  // Get NW corner of the current tile and the tile to the SE
  const nw = tileXYToLatLon(x, y, zoom);
  const se = tileXYToLatLon(x + 1, y + 1, zoom);

  // Calculate the center
  const centerLat = (nw.lat + se.lat) / 2;
  const centerLon = (nw.lon + se.lon) / 2;

  return L.latLng(centerLat, centerLon);
};

// --- End OSM Tile Calculation Utilities ---

/**
 * Behebt das Problem mit fehlenden Icon-Pfaden in Leaflet
 * Dies ist ein bekanntes Problem bei der Verwendung von Leaflet mit Bundlern wie Webpack oder Vite
 */
export const fixLeafletIconPath = (): void => {
  // @ts-ignore - Typendefinitionen sind nicht vollständig
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

/**
 * Erstellt eine gedrosselte (throttled) Version einer Funktion
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Erstellt eine verzögerte (debounced) Version einer Funktion
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};
