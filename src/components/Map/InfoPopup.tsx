import { Popup } from 'react-leaflet';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface InfoPopupProps {
  city: City;
  onClose?: () => void; // Make onClose optional for hover previews
  isHoverPreview?: boolean; // Add prop to indicate hover state
}

/**
 * Komponente zur Anzeige detaillierter Informationen über eine Stadt
 * Zeigt eine vereinfachte Version beim Hovern an.
 */
const InfoPopup = ({ city, onClose, isHoverPreview = false }: InfoPopupProps) => {
  // Base Popup options
  const popupOptions = {
    position: [city.latitude, city.longitude] as L.LatLngExpression,
    maxWidth: isHoverPreview ? 150 : 240, // Smaller for hover
    minWidth: isHoverPreview ? 100 : 200,
    autoPan: !isHoverPreview, // No autopan for hover
    closeButton: !isHoverPreview, // No close button for hover
    className: `info-popup-container ${isHoverPreview ? 'city-popup-hover' : 'city-popup reduced-size'}`, // Add container class
    eventHandlers: onClose && !isHoverPreview ? { popupclose: onClose } : undefined, // Only add handler if onClose exists and not hover
  };

  return (
    <Popup {...popupOptions}>
      {isHoverPreview ? (
        // Simplified Hover Content
        <div className="city-info-hover p-1">
          <h3 className="text-sm font-semibold text-blue-900 truncate">{city.name}</h3>
          <p className="text-xs text-gray-500 truncate">{city.country}</p>
        </div>
      ) : (
        // Full Click Content
        <div className="city-info">
          <h3 className="text-base font-bold text-blue-800">{city.name}</h3>
          <p className="text-xs text-gray-600 border-b pb-2 mb-2">{city.country}</p>

          <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium text-sm">Bevölkerung:</p>
              <p className="font-bold text-blue-700 text-sm">{formatPopulation(city.population)}</p>
            </div>

            {city.foundedYear && (
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-sm">Gegründet:</p>
                <p className="text-sm">{city.foundedYear}</p>
              </div>
            )}

            <p className="my-2 text-xs text-gray-700">{city.description}</p>

            {city.landmarks && city.landmarks.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <strong className="text-xs text-blue-800 block mb-1">Sehenswürdigkeiten:</strong>
                <ul className="list-disc list-inside">
                  {city.landmarks.map((landmark, index) => (
                    <li key={index} className="text-xs text-gray-700">{landmark}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
};

export default InfoPopup;
