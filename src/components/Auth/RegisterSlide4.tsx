import React, { useState } from 'react';

interface RegisterSlide4Props {
  prevSlide: () => void;
  handleSubmit: () => void;
}

const RegisterSlide4: React.FC<RegisterSlide4Props> = ({ prevSlide, handleSubmit }) => {
  const [locationAccess, setLocationAccess] = useState(false);
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  // List of 200 cities (replace with your actual list)
  const cities = [
    'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
    'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Mannheim',
    'Karlsruhe', 'Münster', 'Wiesbaden', 'Augsburg', 'Aachen', 'Mönchengladbach', 'Gelsenkirchen', 'Braunschweig', 'Chemnitz', 'Kiel',
    'Magdeburg', 'Halle', 'Freiburg', 'Krefeld', 'Lübeck', 'Oberhausen', 'Erfurt', 'Mainz', 'Rostock', 'Kassel',
    'Hagen', 'Saarbrücken', 'Potsdam', 'Hamm', 'Mülheim', 'Ludwigshafen', 'Oldenburg', 'Leverkusen', 'Osnabrück', 'Solingen',
    'Heidelberg', 'Herne', 'Neuss', 'Darmstadt', 'Paderborn', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Wolfsburg',
    'Offenbach', 'Ulm', 'Heilbronn', 'Pforzheim', 'Göttingen', 'Bottrop', 'Recklinghausen', 'Reutlingen', 'Koblenz', 'Bergisch Gladbach',
    'Bremerhaven', 'Jena', 'Trier', 'Erlangen', 'Moers', 'Hildesheim', 'Salzgitter', 'Siegen', 'Gera', 'Cottbus',
    'Gütersloh', 'Iserlohn', 'Schwerin', 'Esslingen', 'Ratingen', 'Lüneburg', 'Dessau-Roßlau', 'Marl', 'Velbert', 'Düren',
    'Villingen-Schwenningen', 'Worms', 'Konstanz', 'Gladbeck', 'Neubrandenburg', 'Wilhelmshaven', 'Gießen', 'Detmold', 'Tübingen', 'Lüdenscheid',
    'Minden', 'Flensburg', 'Bayreuth', 'Celle', 'Landshut', 'Bamberg', 'Aschaffenburg', 'Passau', 'Kempten', 'Stralsund',
    'Greifswald', 'Wismar', 'Görlitz', 'Plauen', 'Zwickau', 'Freiberg', 'Bautzen', 'Pirna', 'Riesa', 'Meißen',
    'Hoyerswerda', 'Kamenz', 'Radebeul', 'Coswig', 'Grimma', 'Delitzsch', 'Eilenburg', 'Torgau', 'Wurzen', 'Oschatz',
    'Döbeln', 'Mittweida', 'Freital', 'Limbach-Oberfrohna', 'Glauchau', 'Meerane', 'Crimmitschau', 'Zittau', 'Löbau', 'Weißwasser',
    'Niesky', 'Bischofswerda', 'Hoyerswerda', 'Senftenberg', 'Finsterwalde', 'Eisenhüttenstadt', 'Spremberg', 'Forst', 'Guben',
    'Prenzlau', 'Schwedt', 'Eberswalde', 'Frankfurt (Oder)', 'Oranienburg', 'Neuruppin', 'Brandenburg an der Havel', 'Potsdam', 'Rathenow',
    'Luckenwalde', 'Fürstenwalde', 'Strausberg', 'Bernau', 'Königs Wusterhausen', 'Nauen', 'Falkensee', 'Hennigsdorf', 'Teltow',
    'Werder', 'Zossen', 'Ludwigsfelde', 'Beelitz', 'Stahnsdorf', 'Ahrensfelde', 'Neuenhagen', 'Fredersdorf-Vogelsdorf', 'Hoppegarten', 'Petershagen/Eggersdorf'
  ];

  const handleLocationAccess = () => {
    // TODO: Implement location access logic here (same as map page)
    // For now, just set locationAccess to true
    setLocationAccess(true);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);

    // Filter cities for suggestions
    const filteredCities = cities.filter((c) => c.toLowerCase().startsWith(value.toLowerCase()));
    setCitySuggestions(filteredCities.slice(0, 5)); // Limit to 5 suggestions
  };

  const selectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setCitySuggestions([]); // Clear suggestions after selection
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen (4/4)</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standortzugriff
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Möchten Sie Ihren Standort teilen, um Restaurants in Ihrer Nähe zu finden?
        </p>
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleLocationAccess}
        >
          Standortzugriff aktivieren
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          Oder Stadt auswählen
        </label>
        <input
          type="text"
          id="city"
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={city}
          onChange={handleCityChange}
        />
        {citySuggestions.length > 0 && (
          <ul className="border rounded-md shadow-sm mt-1">
            {citySuggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => selectCity(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between">
        <button
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={prevSlide}
        >
          Zurück
        </button>
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleSubmit}
        >
          Abschließen
        </button>
      </div>
    </div>
  );
};

export default RegisterSlide4;
