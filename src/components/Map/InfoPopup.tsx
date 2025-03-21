import { Popup } from 'react-leaflet';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface InfoPopupProps {
  city: City;
  onClose: () => void;
}

/**
 * Komponente zur Anzeige detaillierter Informationen über eine Stadt
 */
const InfoPopup = ({ city, onClose }: InfoPopupProps) => {
  return (
    <Popup
      position={[city.latitude, city.longitude]}
      onClose={onClose}
      className="city-popup"
      maxWidth={300}
      minWidth={250}
      autoPan={true}
    >
      <div className="city-info">
        <h3 className="text-lg font-bold text-blue-800">{city.name}</h3>
        <p className="text-sm text-gray-600 border-b pb-2 mb-2">{city.country}</p>
        
        <div className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium">Bevölkerung:</p>
            <p className="font-bold text-blue-700">{formatPopulation(city.population)}</p>
          </div>
          
          {city.foundedYear && (
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Gegründet:</p>
              <p>{city.foundedYear}</p>
            </div>
          )}
          
          <p className="my-3 text-sm text-gray-700">{city.description}</p>
          
          {city.landmarks && city.landmarks.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <strong className="text-sm text-blue-800 block mb-1">Sehenswürdigkeiten:</strong>
              <ul className="list-disc list-inside">
                {city.landmarks.map((landmark, index) => (
                  <li key={index} className="text-sm text-gray-700">{landmark}</li>
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
