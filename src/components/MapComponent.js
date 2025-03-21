import React, { useState, useEffect } from 'react';
import { Box, IconButton, useDisclosure, useToast } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Moderne Version des Marker-Clustering
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import '@changey/react-leaflet-markercluster/dist/styles.min.css'; // Aktualisierter Pfad für Stile
import markersData from '../data/markers.json';
import RadiusDrawer from './RadiusDrawer';
import { calculateDistance } from '../utils/distance';

// Komponente zum Aktualisieren der Kartenansicht wenn sich die Position ändert
function MapViewHandler({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 5);
    }
  }, [center, map]);
  
  return null;
}

// Benutzerdefinierte Marker-Komponente für visuelle Verbesserungen
const EnhancedMarker = ({ position, name, address, description, isUserLocation = false }) => {
  const markerSize = isUserLocation ? 8 : 6;
  const markerColor = isUserLocation ? '#FF4136' : '#0074D9';
  const fillOpacity = isUserLocation ? 0.8 : 0.6;
  const pulseClass = isUserLocation ? 'pulse-marker' : '';
  
  return (
    <CircleMarker
      center={position}
      radius={markerSize}
      pathOptions={{ 
        fillColor: markerColor, 
        color: 'white', 
        weight: 2,
        fillOpacity: fillOpacity 
      }}
      className={`custom-marker ${pulseClass}`}
    >
      <Tooltip>{name}</Tooltip>
      {!isUserLocation && (
        <Popup>
          <Box p={2} borderRadius="md" boxShadow="sm" bg="white">
            <Box as="h3" fontWeight="bold" mb={2} fontSize="lg" color="teal.600">{name}</Box>
            <Box fontSize="sm" mb={2} color="gray.600">{address}</Box>
            <Box fontSize="sm" color="gray.800">{description}</Box>
          </Box>
        </Popup>
      )}
    </CircleMarker>
  );
};

const MapComponent = () => {
  const [userPosition, setUserPosition] = useState(null);
  const [radius, setRadius] = useState(500); // Standard: Alle Marker anzeigen
  const [visibleMarkers, setVisibleMarkers] = useState(markersData);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Benutzerposition abrufen
  useEffect(() => {
    const defaultPosition = { lat: 40.7128, lng: -74.0060 }; // New York als Standard
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Standort gefunden",
            description: "Wir haben Ihren aktuellen Standort ermittelt.",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right"
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserPosition(defaultPosition);
          toast({
            title: "Standort nicht verfügbar",
            description: "Wir verwenden New York als Standard-Standort.",
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "top-right"
          });
        }
      );
    } else {
      setUserPosition(defaultPosition);
      toast({
        title: "Geolocation nicht unterstützt",
        description: "Ihr Browser unterstützt keine Geolocation.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    }
  }, [toast]);
  
  // Erweiterte onClose-Funktion, die den Toast nur beim Schließen des Drawers anzeigt
  const handleDrawerClose = () => {
    onClose();
    if (userPosition && radius < 500) {
      toast({
        title: `${visibleMarkers.length} Orte gefunden`,
        description: `Im Umkreis von ${radius} km.`,
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "bottom"
      });
    }
  };
  
  // Marker nach Radius filtern
  useEffect(() => {
    if (userPosition && radius < 500) {
      const filtered = markersData.filter(marker => {
        const distance = calculateDistance(
          userPosition.lat,
          userPosition.lng,
          marker.latitude,
          marker.longitude
        );
        return distance <= radius;
      });
      setVisibleMarkers(filtered);
      
      // Toast-Benachrichtigung entfernt, wird jetzt nur noch beim Schließen des Drawers angezeigt
    } else {
      setVisibleMarkers(markersData);
    }
  }, [userPosition, radius]);
  
  if (!userPosition) {
    return <Box p={5}>Karte wird geladen...</Box>;
  }
  
  // Benutzerdefinierte Cluster-Icon-Funktion
  const createCustomClusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    let size = 40;
    
    if (count > 50) size = 60;
    else if (count > 20) size = 50;
    
    return L.divIcon({
      html: `<div class="custom-marker-cluster" style="width: ${size}px; height: ${size}px;">${count}</div>`,
      className: 'custom-cluster',
      iconSize: L.point(size, size)
    });
  };
  
  return (
    <Box position="relative" h="calc(100vh - 64px)" w="100%">
      <MapContainer 
        center={[userPosition.lat, userPosition.lng]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapViewHandler center={[userPosition.lat, userPosition.lng]} />
        
        {/* Benutzerposition Marker */}
        <EnhancedMarker 
          position={[userPosition.lat, userPosition.lng]}
          name="Ihr Standort"
          isUserLocation={true}
        />
        
        {/* POI Marker mit Clustering */}
        <MarkerClusterGroup 
          chunkedLoading
          iconCreateFunction={createCustomClusterIcon}
        >
          {visibleMarkers.map(marker => (
            <EnhancedMarker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              name={marker.name}
              address={marker.address}
              description={marker.description}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {/* Filter-Button */}
      <IconButton
        aria-label="Filter öffnen"
        icon={<HamburgerIcon />}
        position="absolute"
        bottom="20px"
        left="20px"
        zIndex={1000}
        colorScheme="teal"
        borderRadius="full"
        boxShadow="lg"
        onClick={onOpen}
        size="lg"
        _hover={{ transform: 'scale(1.1)' }}
        transition="all 0.2s"
      />
      
      {/* Radius-Drawer - onClose ersetzt durch handleDrawerClose */}
      <RadiusDrawer 
        isOpen={isOpen} 
        onClose={handleDrawerClose} 
        radius={radius} 
        setRadius={setRadius} 
        resetRadius={() => setRadius(500)} 
      />
    </Box>
  );
};

export default MapComponent;
