import React, { useEffect, useState } from 'react';
import { City } from '../../types';
import InfoPopup from './InfoPopup';
import InfoCard from '../UI/InfoCard';
import { useMap } from 'react-leaflet';

interface ResponsiveInfoDisplayProps {
  city: City | null;
  onClose: () => void;
}

/**
 * Komponente, die je nach Bildschirmgröße zwischen Popup und Card wechselt
 */
const ResponsiveInfoDisplay: React.FC<ResponsiveInfoDisplayProps> = ({ city, onClose }) => {
  const map = useMap();
  const [usePopup, setUsePopup] = useState(true);
  
  // Überwache Größenänderungen und entscheide, welche Anzeige verwendet werden soll
  useEffect(() => {
    const checkSize = () => {
      setUsePopup(window.innerWidth < 1024); // Unter 1024px verwenden wir das Popup
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  
  if (!city) return null;
  
  // Je nach Bildschirmgröße und Gerät die passende Info-Darstellung wählen
  return usePopup ? (
    <InfoPopup city={city} onClose={onClose} />
  ) : (
    <div className="absolute top-4 right-4 z-[1000] max-w-md w-full">
      <InfoCard city={city} onClose={onClose} />
    </div>
  );
};

export default ResponsiveInfoDisplay;
