import React, { useState } from 'react';

interface RegisterSlide3Props {
  updateFormData: (data: any) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

const RegisterSlide3: React.FC<RegisterSlide3Props> = ({ updateFormData, nextSlide, prevSlide }) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [cuisine, setCuisine] = useState('');

  const languages = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch'];
  const cuisines = ['Italienisch', 'Japanisch', 'Mexikanisch', 'Indisch'];

  const addLanguage = () => {
    if (language && !selectedLanguages.includes(language)) {
      setSelectedLanguages([...selectedLanguages, language]);
      setLanguage('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setSelectedLanguages(selectedLanguages.filter((lang) => lang !== languageToRemove));
  };

  const addCuisine = () => {
    if (cuisine && !selectedCuisines.includes(cuisine)) {
      setSelectedCuisines([...selectedCuisines, cuisine]);
      setCuisine('');
    }
  };

  const removeCuisine = (cuisineToRemove: string) => {
    setSelectedCuisines(selectedCuisines.filter((cuisine) => cuisine !== cuisineToRemove));
  };

  const handleNext = () => {
    updateFormData({ languages: selectedLanguages, cuisines: selectedCuisines });
    nextSlide();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen (3/4)</h2>

      <div className="mb-4">
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
          Sprachen
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedLanguages.map((lang) => (
            <div key={lang} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 inline-flex items-center">
              {lang}
              <button
                type="button"
                className="ml-2 focus:outline-none"
                onClick={() => removeLanguage(lang)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <select
            id="language"
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">Sprache auswählen</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={addLanguage}
          >
            Hinzufügen
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
          Bevorzugte Küchen
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCuisines.map((cuisine) => (
            <div key={cuisine} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 inline-flex items-center">
              {cuisine}
              <button
                type="button"
                className="ml-2 focus:outline-none"
                onClick={() => removeCuisine(cuisine)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <select
            id="cuisine"
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            <option value="">Küche auswählen</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="ml-2 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={addCuisine}
          >
            Hinzufügen
          </button>
        </div>
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
          onClick={handleNext}
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

export default RegisterSlide3;
