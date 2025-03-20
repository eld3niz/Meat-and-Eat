import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Moderner Ansatz zur Behebung des Leaflet-Icon-Problems
const MapComponent: React.FC = () => {
  useEffect(() => {
    // Leaflet-Icon-Fix mit useEffect, um sicherzustellen, dass es nur clientseitig ausgeführt wird
    const defaultIcon = L.icon({
      iconUrl: '/images/marker-icon.png',
      iconRetinaUrl: '/images/marker-icon-2x.png',
      shadowUrl: '/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={3}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[51.505, -0.09]}>
          <Popup>
            London <br /> Eine wichtige Weltstadt.
          </Popup>
        </Marker>
        <Marker position={[48.8566, 2.3522]}>
          <Popup>
            Paris <br /> Die Stadt der Liebe.
          </Popup>
        </Marker>
        <Marker position={[40.7128, -74.006]}>
          <Popup>
            New York <br /> Die Stadt, die niemals schläft.
          </Popup>
        </Marker>
      </MapContainer>
      <div className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-lg">
        <h3 className="font-bold text-primary">Legende</h3>
        <div className="text-sm mt-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Bedeutende Städte</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapComponent
