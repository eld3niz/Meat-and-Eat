import { Marker, Tooltip } from 'react-leaflet';
import { City } from '../../types';
import { createMarkerIcon, formatPopulation } from '../../utils/mapUtils';

interface MarkersProps {
  cities: City[];
  onMarkerClick: (city: City) => void;
}

/**
 * Komponente zur Darstellung der Stadt-Marker auf der Karte
 */
const Markers = ({ cities, onMarkerClick }: MarkersProps) => {
  return (
    <>
      {cities.map((city) => (
        <Marker
          key={city.id}
          position={[city.latitude, city.longitude]}
          icon={createMarkerIcon(city.population)}
          eventHandlers={{
            click: () => onMarkerClick(city)
          }}
        >
          <Tooltip>
            <div>
              <strong>{city.name}, {city.country}</strong>
              <div>Bevölkerung: {formatPopulation(city.population)}</div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
};

export default Markers;
