import React, { useState } from 'react';
import { languageOptions, cuisineOptions } from '../../data/options';
import Button from '../UI/Button'; // Import Button component

// Remove locally defined options
// const languageOptions = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch'];
// const cuisineOptions = ['Italienisch', 'Japanisch', 'Mexikanisch', 'Indisch'];

interface RegisterSlide3Props {
  updateFormData: (data: any) => void;
  prevSlide: () => void;
  handleSubmit: () => Promise<void>; // Expecting an async function
  isLoading: boolean; // Add isLoading prop
}

const RegisterSlide3: React.FC<RegisterSlide3Props> = ({ updateFormData, prevSlide, handleSubmit, isLoading }) => { // Destructure isLoading
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [cuisine, setCuisine] = useState('');

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
    // Update form data before calling submit
    updateFormData({ languages: selectedLanguages, cuisines: selectedCuisines });
    // No need to call handleSubmit directly, it's handled by the button onClick
  };

  return (
    <div>
      {/* Update step number */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Interessen (5/5)</h2>

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
            {languageOptions.map((lang) => (
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
            {cuisineOptions.map((cuisine) => (
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
        {/* Use Button component and handle isLoading state */}
        <Button
          onClick={prevSlide}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400" // Secondary style
          disabled={isLoading} // Disable if loading
        >
          Zurück
        </Button>
        <Button
          className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center" // Changed color to green for final step
          onClick={() => {
              // Update form data just before submitting
              updateFormData({ languages: selectedLanguages, cuisines: selectedCuisines });
              handleSubmit(); // Call the async submit function
          }}
          disabled={isLoading} // Disable if loading
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Wird verarbeitet...
            </>
          ) : (
            'Registrierung abschließen' // Changed text
          )}
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlide3;
