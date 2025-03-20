import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Stadt-Interface für Typsicherheit
interface City {
  id: number;
  name: string;
  position: [number, number];
  description: string;
}

// Moderner Ansatz zur Behebung des Leaflet-Icon-Problems
const MapComponent: React.FC = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  
  // Liste aller Städte
  const cities: City[] = [
    {
      id: 1,
      name: 'London',
      position: [51.505, -0.09],
      description: 'Eine wichtige Weltstadt.'
    },
    {
      id: 2,
      name: 'Paris',
      position: [48.8566, 2.3522],
      description: 'Die Stadt der Liebe.'
    },
    {
      id: 3,
      name: 'New York',
      position: [40.7128, -74.006],
      description: 'Die Stadt, die niemals schläft.'
    },
    {
      id: 4,
      name: 'Tokio',
      position: [35.6762, 139.6503],
      description: 'Die größte Metropolregion der Welt.'
    },
    {
      id: 5,
      name: 'Sydney',
      position: [-33.8688, 151.2093],
      description: 'Die größte Stadt Australiens.'
    },
    {
      id: 6,
      name: 'Rio de Janeiro',
      position: [-22.9068, -43.1729],
      description: 'Bekannt für den Karneval und die Christusstatue.'
    }
  ];

  // Gefilterte Städte basierend auf der Auswahl
  const filteredCities = selectedCity === 'all' 
    ? cities 
    : cities.filter(city => city.name === selectedCity);

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
        center={[20, 0]} // Zentrierter Blick auf die Weltkarte
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Dynamisches Rendern der gefilterten Marker */}
        {filteredCities.map(city => (
          <Marker key={city.id} position={city.position}>
            <Popup>
              {city.name} <br /> {city.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Filter-Button unten links */}
      <button 
        onClick={() => setShowFilterModal(true)}
        className="absolute bottom-4 left-4 z-[500] bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
      </button>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[600] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Stadt filtern</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="cityFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Stadt auswählen
              </label>
              <select
                id="cityFilter"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="all">Alle Städte</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowFilterModal(false)}
                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
              >
                Anwenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapComponent
