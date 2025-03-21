import { useState, useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Erzeugt ein benutzerdefiniertes rotes Icon für den Benutzerstandort
 */
const createUserLocationIcon = (): L.DivIcon => {
  return L.divIcon({
    html: `
      <div style="background-color: rgba(255, 0, 0, 0.6); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.3)"></div>
      <div style="background-color: rgba(255, 0, 0, 0.3); width: 36px; height: 36px; border-radius: 50%; position: absolute; top: -10px; left: -10px; animation: pulse 1.5s infinite;"></div>
    `,
    className: 'user-location-marker',
    iconSize: [36, 36],
    iconAnchor: [8, 8], // Zentriert das Icon auf dem Standort
  });
};

/**
 * Komponente zur Anzeige des Benutzerstandorts auf der Karte
 */
const UserLocationMarker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const map = useMap();
  
  // Benutzerstandort mit der Geolocation API ermitteln
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird von Ihrem Browser nicht unterstützt.');
      return;
    }
    
    // CSS für Pulseffekt hinzufügen
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.2); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    
    // Initialen Standort abrufen und bei Änderungen aktualisieren
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setPosition([position.coords.latitude, position.coords.longitude]);
        setError(null);
      },
      (error) => {
        console.error('Fehler beim Abrufen des Standorts:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Standortabfrage wurde verweigert. Bitte erteilen Sie die Erlaubnis in Ihren Browser-Einstellungen.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Standortinformationen sind derzeit nicht verfügbar.');
            break;
          case error.TIMEOUT:
            setError('Die Anfrage zur Standortbestimmung ist abgelaufen.');
            break;
          default:
            setError('Ein unbekannter Fehler ist aufgetreten.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
    
    setLocationWatchId(watchId);
    
    // Cleanup-Funktion zum Entfernen des Standort-Trackings
    return () => {
      if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Bei erstmaligem Erhalten des Standorts zur Position zoomen
  useEffect(() => {
    if (position && map) {
      // Optional: Karte zum Benutzerstandort bewegen/zoomen
      // map.flyTo(position, 13);
    }
  }, [position, map]);
  
  // Wenn wir den Standort haben, zeige den Marker an
  if (position) {
    return (
      <Marker 
        position={position} 
        icon={createUserLocationIcon()}
      >
        <Tooltip permanent={false} direction="top" offset={[0, -10]}>
          <div>
            <strong>Ihr Standort</strong>
            <p className="text-xs text-gray-600">Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}</p>
          </div>
        </Tooltip>
      </Marker>
    );
  }
  
  // Zeige eine Fehlermeldung, wenn der Standort nicht ermittelt werden konnte
  if (error) {
    console.warn('Standortfehler:', error);
    // Wir rendern keinen Marker, wenn ein Fehler auftritt
  }
  
  // Wenn wir noch auf den Standort warten, zeige nichts an
  return null;
};

export default UserLocationMarker;
