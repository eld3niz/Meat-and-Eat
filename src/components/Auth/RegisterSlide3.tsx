import React, { useState } from 'react';
import { languageOptions, cuisineOptions } from '../../data/options';
import Button from '../UI/Button'; // Import Button component

// Remove locally defined options
// const languageOptions = ['Deutsch', 'Englisch', 'Spanisch', 'Französisch'];
// const cuisineOptions = ['Italienisch', 'Japanisch', 'Mexikanisch', 'Indisch'];

interface RegisterSlide3Props {
  updateFormData: (data: { languages?: string[]; cuisines?: string[]; city?: string }) => void; // More specific type
  nextSlide: () => void;
  prevSlide: () => void; // Add prevSlide
  currentSlide: number;
  totalSlides: number;
}

const RegisterSlide3: React.FC<RegisterSlide3Props> = ({ updateFormData, nextSlide, prevSlide, currentSlide, totalSlides }) => {
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

  // Renamed handleNext to handleProceed for clarity, though not strictly necessary
  const handleProceed = () => {
    // Update form data before moving to the next slide
    updateFormData({ languages: selectedLanguages, cuisines: selectedCuisines });
    nextSlide(); // Call nextSlide prop
  };

  return (
    <div>
      {/* Update step number */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Interessen & Ort</h2>

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

      {/* Slide Indicator and Navigation */}
      <div className="flex items-center justify-between pt-4">
         {/* Back Button */}
         <Button
            onClick={prevSlide}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400 px-4 py-2 rounded-md w-20 text-center"
          >
            Zurück
          </Button>

        {/* Slide Indicator */}
        <span className="text-sm text-gray-500">
          Slide {currentSlide + 1} / {totalSlides}
        </span>

        {/* Next Button */}
        <Button
           className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-2 rounded-md w-20 text-center"
           onClick={handleProceed}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlide3;
