import L from 'leaflet';

// Define the custom green icon for other users
export const otherUserIcon = L.icon({
    iconUrl: '/path/to/green-marker.png', // <-- Replace with actual path to your green marker image
    iconRetinaUrl: '/path/to/green-marker-2x.png', // <-- Optional: Replace with 2x resolution image
    shadowUrl: '/path/to/marker-shadow.png', // <-- Replace with actual path or remove if no shadow
    iconSize: [25, 41], // Standard Leaflet marker size [width, height]
    iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
    popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
    shadowSize: [41, 41] // Size of the shadow
});

// --- Alternative using DivIcon (if you prefer CSS styling) ---
// Comment out the L.icon definition above and uncomment this if using DivIcon.
// You'll need to add CSS rules for the 'custom-green-marker' class.
/*
export const otherUserIcon = L.divIcon({
    className: 'custom-green-marker', // CSS class for styling
    html: '<svg viewBox="0 0 24 24" fill="#22c55e" width="20px" height="20px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>', // Example inline SVG
    iconSize: [20, 20], // Size of the icon
    iconAnchor: [10, 20], // Anchor point (bottom center)
    popupAnchor: [0, -20] // Popup anchor point
});
*/