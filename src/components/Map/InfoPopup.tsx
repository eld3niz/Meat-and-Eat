import { Popup } from 'react-leaflet';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface InfoPopupProps {
  city: City;
  onClose?: () => void;
}

/**
 * Komponente zur Anzeige detaillierter Informationen über eine Stadt
 */
const InfoPopup: React.FC<InfoPopupProps> = ({ city, onClose }) => {
  const popupOptions = {
    position: [city.latitude, city.longitude] as L.LatLngExpression,
    maxWidth: 240,
    minWidth: 200,
    autoPan: true,
    closeButton: true,
    className: 'info-popup-container city-popup reduced-size',
    eventHandlers: onClose ? { popupclose: onClose } : undefined,
  };

  return (
    <Popup {...popupOptions}>
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
    </Popup>
  );
};

export default InfoPopup;
