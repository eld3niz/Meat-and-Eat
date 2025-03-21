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
