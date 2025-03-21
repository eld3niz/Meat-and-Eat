/**
 * Berechnet die Entfernung zwischen zwei Punkten auf der Erde
 * unter Verwendung der Haversine-Formel
 * @param {number} lat1 - Breitengrad des ersten Punkts (in Grad)
 * @param {number} lon1 - Längengrad des ersten Punkts (in Grad)
 * @param {number} lat2 - Breitengrad des zweiten Punkts (in Grad)
 * @param {number} lon2 - Längengrad des zweiten Punkts (in Grad)
 * @returns {number} Entfernung in Kilometern
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Erdradius in Kilometern
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

// Umrechnung von Grad in Radiant
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};
