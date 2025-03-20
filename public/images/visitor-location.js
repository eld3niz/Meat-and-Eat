/**
 * This script adds a red marker at the visitor's current location
 */

// Function to add the visitor's location marker to the map
function addVisitorMarker(map) {
  // Check if geolocation is available in the browser
  if (navigator.geolocation) {
    // Create a marker element that will be used later
    const visitorMarkerElement = document.createElement('div');
    visitorMarkerElement.className = 'visitor-marker';
    visitorMarkerElement.style.backgroundColor = 'red';
    visitorMarkerElement.style.width = '20px';
    visitorMarkerElement.style.height = '20px';
    visitorMarkerElement.style.borderRadius = '50%';
    visitorMarkerElement.style.border = '2px solid white';
    
    // Request the user's location
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const visitorLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Add a marker at the visitor's location
        const visitorMarker = new mapboxgl.Marker({
          element: visitorMarkerElement,
          color: 'red'
        })
          .setLngLat([visitorLocation.lng, visitorLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML("<h3>You are here</h3>"))
          .addTo(map);
        
        // Optionally center the map on the visitor's location
        // map.flyTo({ center: [visitorLocation.lng, visitorLocation.lat], zoom: 14 });
        
        console.log('Visitor location added to map:', visitorLocation);
      },
      // Error callback
      (error) => {
        console.error('Error getting visitor location:', error.message);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'location-error';
        errorDiv.textContent = 'Could not access your location. ' + error.message;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '10px';
        document.body.prepend(errorDiv);
      },
      // Options
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser');
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'location-error';
    errorDiv.textContent = 'Geolocation is not supported by your browser';
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    document.body.prepend(errorDiv);
  }
}

// Export the function to be used in your main map script
export { addVisitorMarker };
