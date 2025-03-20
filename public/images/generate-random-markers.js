/**
 * Generate 100 random markers on the world map
 */

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
