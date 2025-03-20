// This is just an example of how to integrate the visitor marker functionality
// into your existing map initialization code

// Import the visitor marker functionality
import { addVisitorMarker } from './visitor-location.js';

// Setting the boundaries for the map (approximate world coordinates)
const boundaries = {
  minLat: -85,
  maxLat: 85,
  minLng: -180,
  maxLng: 180
};

// Array of possible marker types
const markerTypes = ['restaurant', 'butcher', 'market', 'farm', 'food_truck'];

// Array of sample names for markers
const sampleNames = [
  'Meat Paradise', 'BBQ Haven', 'Steak House', 'Burger Joint', 'Meat & Grill',
  'Carnivore\'s Delight', 'Prime Cuts', 'Butcher\'s Block', 'Meat Master', 'Grill House',
  'Meat Market', 'Smoky Ribs', 'The Meat Spot', 'Beef & Beyond', 'Grill Masters',
  'The Butchery', 'Fresh Meats', 'Farm to Table', 'Meat Lovers', 'The Grillfather'
];

// Generate a random float between min and max
function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

// Generate a random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random marker
function generateRandomMarker(id) {
  const lat = randomFloat(boundaries.minLat, boundaries.maxLat).toFixed(6);
  const lng = randomFloat(boundaries.minLng, boundaries.maxLng).toFixed(6);
  const type = markerTypes[randomInt(0, markerTypes.length - 1)];
  const name = `${sampleNames[randomInt(0, sampleNames.length - 1)]} ${id}`;
  
  return {
    id: `random-${id}`,
    position: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    },
    type,
    name,
    description: `Random ${type} location ${id}`
  };
}

// Generate 100 random markers
const randomMarkers = [];
for (let i = 1; i <= 100; i++) {
  randomMarkers.push(generateRandomMarker(i));
}

// Output as JSON
console.log(JSON.stringify(randomMarkers, null, 2));

// You'll need a Mapbox access token - replace this with your actual token
mapboxgl.accessToken = 'pk.eyJ1IjoicmVwbGFjZS13aXRoLXlvdXItdG9rLWJvYXJkIiwiY2t4eHh4eHh4MHh4eCJ9.xxxxxxxxxxxxxxxxxxx';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [0, 0],
  zoom: 2
});

// Load random markers (if you have them in a JSON file)
async function loadMarkers() {
  try {
    const response = await fetch('/data/random-markers.json');
    const markers = await response.json();
    
    markers.forEach(marker => {
      // Create a DOM element for the marker
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = `url(/images/markers/${marker.type}.png)`;
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundSize = 'cover';
      
      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat([marker.position.lng, marker.position.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3>${marker.name}</h3><p>${marker.description}</p>`))
        .addTo(map);
    });
  } catch (error) {
    console.error('Error loading markers:', error);
  }
}

// Add the visitor's location marker after the map has loaded
map.on('load', () => {
  // Load markers
  loadMarkers();
  
  // Add the visitor's location marker
  addVisitorMarker(map);
});