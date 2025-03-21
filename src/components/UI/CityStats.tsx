import { useState, useMemo } from 'react';
import { City } from '../../types';
import { formatPopulation } from '../../utils/mapUtils';

interface CityStatsProps {
  cities: City[];
  onCitySelect: (cityId: number) => void;
  onCountryFilter: (country: string | null) => void;
}

/**
 * Komponente zur Anzeige von Statistiken und Filteroptionen für Städte
 */
const CityStats = ({ cities, onCitySelect, onCountryFilter }: CityStatsProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top10' | 'countries'>('top10');
  
  // Liste der verfügbaren Länder mit Anzahl der Städte
  const countries = useMemo(() => {
    const countryMap = new Map<string, number>();
    
    cities.forEach(city => {
      const count = countryMap.get(city.country) || 0;
      countryMap.set(city.country, count + 1);
    });
    
    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [cities]);
  
  // Top 10 Städte nach Bevölkerung
  const top10Cities = useMemo(() => {
    return [...cities]
      .sort((a, b) => b.population - a.population)
      .slice(0, 10);
  }, [cities]);
  
  // Filterung nach Land
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value === "all" ? null : e.target.value;
    setSelectedCountry(country);
    onCountryFilter(country);
  };
  
  // Land direkt auswählen
  const handleCountryClick = (country: string) => {
    setSelectedCountry(country);
    onCountryFilter(country);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-semibold mb-4">Stadtstatistiken</h2>
      
      {/* Länderfilter */}
      <div className="mb-4">
        <label htmlFor="country-filter" className="block text-sm font-medium mb-1">
          Nach Land filtern:
        </label>
        <select 
          id="country-filter"
          className="w-full p-2 border rounded"
          value={selectedCountry || "all"}
          onChange={handleCountryChange}
        >
          <option value="all">Alle Länder</option>
          {countries.map(({ country }) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-3">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'top10' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('top10')}
        >
          Top 10 Städte
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'countries' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('countries')}
        >
          Länder
        </button>
      </div>
      
      {/* Tab-Inhalte */}
      {activeTab === 'top10' ? (
        <div>
          <ul className="space-y-1">
            {top10Cities.map(city => (
              <li 
                key={city.id}
                className="text-sm hover:bg-gray-100 p-2 cursor-pointer rounded flex justify-between items-center"
                onClick={() => onCitySelect(city.id)}
              >
                <span className="font-medium truncate mr-2">{city.name}, {city.country}</span>
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatPopulation(city.population)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <ul className="space-y-1">
            {countries.slice(0, 15).map(({ country, count }) => (
              <li 
                key={country}
                className="text-sm hover:bg-gray-100 p-2 cursor-pointer rounded flex justify-between items-center"
                onClick={() => handleCountryClick(country)}
              >
                <span className="font-medium">{country}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{count}</span>
              </li>
            ))}
          </ul>
          {countries.length > 15 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Und {countries.length - 15} weitere Länder...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CityStats;
