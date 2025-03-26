import { useState, useEffect, useRef } from 'react';
import { Marker, Tooltip, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  position?: [number, number] | null;
  radius?: number;
  showRadius?: boolean;
  onPositionUpdate?: (position: [number, number] | null) => void;
}

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
 * Verbesserte Komponente zur Anzeige des Benutzerstandorts
 */
const UserLocationMarker = ({ position, radius, showRadius, onPositionUpdate }: UserLocationMarkerProps) => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(position || null);
  const [error, setError] = useState<string | null>(null);
  const locationWatchIdRef = useRef<number | null>(null);
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  const map = useMap();
  
  // Benutzerstandort mit der Geolocation API ermitteln
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird von Ihrem Browser nicht unterstützt.');
      return;
    }
    
    // CSS für Pulseffekt hinzufügen
    if (!styleElRef.current) {
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `;
      document.head.appendChild(styleEl);
      styleElRef.current = styleEl;
    }
    
    // Zunächst einmalig Position abrufen (schnellere Rückmeldung)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(newPosition);
        if (onPositionUpdate) {
          onPositionUpdate(newPosition);
        }
        setError(null);
      },
      (error) => {
        handleGeolocationError(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    
    // Dann kontinuierlich aktualisieren
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(newPosition);
        if (onPositionUpdate) {
          onPositionUpdate(newPosition);
        }
        setError(null);
      },
      (error) => {
        handleGeolocationError(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    
    // Hilfsfunktion für Fehlermeldungen
    function handleGeolocationError(error: GeolocationPositionError) {
      console.error('Geolocation-Fehler:', error);
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Standortabfrage wurde verweigert. Bitte erteilen Sie die Erlaubnis in Ihren Browser-Einstellungen.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Standortinformationen sind derzeit nicht verfügbar.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Die Anfrage zur Standortbestimmung ist abgelaufen.';
          break;
      }
      
      setError(errorMessage);
      if (onPositionUpdate) {
        onPositionUpdate(null);
      }
    }
    
    // Cleanup-Funktion
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      
      if (styleElRef.current) {
        document.head.removeChild(styleElRef.current);
        styleElRef.current = null;
      }
      
      if (onPositionUpdate) {
        onPositionUpdate(null);
      }
    };
  }, [onPositionUpdate]);
  
  // Zoom zur Position, wenn gewünscht
  useEffect(() => {
    if (userPosition && map) {
      // Optional: Bei erstmaligem Erhalten des Standorts zur Position zoomen
      map.flyTo(userPosition, 10);
    }
  }, [userPosition, map]);
  
  // Rendering-Logik
  if (userPosition) {
    return (
      <>
        <Marker 
          position={userPosition} 
          icon={createUserLocationIcon()}
        >
          <Tooltip permanent={false} direction="top" offset={[0, -10]}>
            <div>
              <strong>Ihr Standort</strong>
              <p className="text-xs text-gray-600">Lat: {userPosition[0].toFixed(4)}, Lng: {userPosition[1].toFixed(4)}</p>
            </div>
          </Tooltip>
        </Marker>
        
        {showRadius && radius && radius > 0 && (
          <Circle
            center={userPosition}
            radius={radius * 1000} // Umrechnung in Meter für Leaflet
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
        )}
      </>
    );
  }
  
  // Bessere Fehlermeldung
  if (error) {
    console.warn('Standortfehler:', error);
    
    return (
      <div className="absolute bottom-4 right-4 z-50 bg-red-50 text-red-700 p-3 rounded-lg shadow-lg max-w-xs">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-sm">Standortproblem:</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Wenn wir noch auf den Standort warten, zeige Ladeanzeige
  return (
    <div className="absolute bottom-4 right-4 z-50 bg-blue-50 text-blue-700 p-3 rounded-lg shadow-lg">
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
        <span className="text-xs">Standort wird ermittelt...</span>
      </div>
    </div>
  );
};

export default UserLocationMarker;
