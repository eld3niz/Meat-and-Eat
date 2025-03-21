// ...existing code...

// This function likely filters markers based on radius
const filterMarkersByRadius = (markers, userLocation, radius) => {
  if (!userLocation) return markers; // Return all markers if no user location
  
  const filteredMarkers = markers.filter(marker => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      marker.lat,
      marker.lng
    );
    return distance <= radius;
  });
  
  // The key change: return empty array instead of all markers when none are in radius
  return filteredMarkers.length > 0 ? filteredMarkers : [];
};

// Where markers are rendered on the map
const renderMarkers = () => {
  const markersToShow = filterMarkersByRadius(allMarkers, userLocation, selectedRadius);
  
  return markersToShow.map(marker => (
    <Marker
      key={marker.id}
      position={{ lat: marker.lat, lng: marker.lng }}
      // ...existing marker props...
    />
  ));
};

// ...existing code...