import L from 'leaflet';

// Define the custom green icon for other users using DivIcon with inline SVG

// Simple green circle marker
// export const otherUserIcon = L.divIcon({
//     className: 'custom-green-div-icon', // Use this class for potential additional CSS styling if needed
//     html: `<svg viewBox="0 0 20 20" fill="#22c55e" width="16px" height="16px"><circle cx="10" cy="10" r="8" stroke="white" stroke-width="1.5"/></svg>`,
//     iconSize: [16, 16], // Size of the icon
//     iconAnchor: [8, 8], // Anchor point (center)
//     popupAnchor: [0, -8] // Popup anchor point relative to iconAnchor
// });

// Simple green pin marker (similar to default Leaflet but green)
export const otherUserIcon = L.divIcon({
    className: 'custom-green-div-icon', // Use this class for potential additional CSS styling if needed
    html: `<svg viewBox="-4 -1 30 45" fill="#28a745" width="25px" height="41px" style="overflow: visible;"><path d="M12 0C5.373 0 0 5.373 0 12c0 8.284 12 24 12 24s12-15.716 12-24C24 5.373 18.627 0 12 0zm0 17a5 5 0 110-10 5 5 0 010 10z" stroke="white" stroke-width="1"/></svg>`,
    iconSize: [25, 41], // Standard Leaflet pin size
    iconAnchor: [12.5, 41], // Anchor point (bottom center tip)
    popupAnchor: [0, -41] // Popup anchor point relative to iconAnchor
});