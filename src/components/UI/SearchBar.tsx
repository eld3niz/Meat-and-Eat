import { useState, useEffect, useRef } from 'react';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface SearchBarProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
}

/**
 * Suchleiste für die Städtesuche
 */
const SearchBar = ({ cities, onCitySelect }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Klick außerhalb der Suchbox schließt die Ergebnisse
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Filtere Städte basierend auf dem Suchbegriff
  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10); // Begrenze auf die ersten 10 Ergebnisse
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };
  
  const handleCityClick = (cityId: number) => {
    onCitySelect(cityId);
    setShowResults(false);
    setSearchTerm('');
  };
  
  return (
    <div className="relative mb-4" ref={searchRef}>
      <div className="flex items-center border rounded overflow-hidden">
        <input
          type="text"
          placeholder="Stadt oder Land suchen..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length > 0 && setShowResults(true)}
          className="w-full p-2 outline-none"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="px-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
      
      {showResults && filteredCities.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border">
          <ul>
            {filteredCities.map(city => (
              <li 
                key={city.id}
                className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleCityClick(city.id)}
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-gray-600">
                  {city.country} - {formatPopulation(city.population)} Einwohner
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
