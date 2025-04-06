import React, { useState } from 'react';
import Button from '../UI/Button'; // Assuming a Button component exists

interface RegisterSlideNew1Props {
  updateFormData: (data: { is_local?: string | null; budget?: number | null }) => void;
  prevSlide: () => void;
  nextSlide: () => void; // Added nextSlide
  // Removed handleSubmit and isLoading
  currentSlide: number;
  totalSlides: number;
}

const localOptions = ["Local", "Expat", "Tourist", "Other"];

const RegisterSlideNew1: React.FC<RegisterSlideNew1Props> = ({ updateFormData, prevSlide, nextSlide, currentSlide, totalSlides }) => {
  const [selectedLocalStatus, setSelectedLocalStatus] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);

  const handleLocalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? null : e.target.value;
    setSelectedLocalStatus(value);
    updateFormData({ is_local: value });
  };

  const handleBudgetClick = (budgetLevel: number) => {
    const newBudget = selectedBudget === budgetLevel ? null : budgetLevel;
    setSelectedBudget(newBudget);
    updateFormData({ budget: newBudget });
  };

  return (
    <div className="space-y-6">
      {/* Update step number */}
      <h2 className="text-xl font-semibold text-gray-700">Über dich</h2>
      <p className="text-sm text-gray-500">
        Tell us a bit more. Filling this in leads to more meet up success! (Optional)
      </p>

      {/* Local Status Dropdown */}
      <div>
        <label htmlFor="localStatus" className="block text-sm font-medium text-gray-700 mb-1">
          Are you a local?
        </label>
        <select
          id="localStatus"
          name="localStatus"
          value={selectedLocalStatus ?? ""}
          onChange={handleLocalChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">-- Select --</option>
          {localOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Budget Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Budget Preference
        </label>
        <div className="flex space-x-4">
          {[1, 2, 3].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => handleBudgetClick(level)}
              className={`p-3 rounded-full text-2xl transition-transform duration-150 ease-in-out ${
                selectedBudget === level
                  ? 'bg-yellow-300 scale-110 shadow-lg'
                  : 'bg-gray-200 hover:bg-gray-300 scale-100'
              }`}
              aria-pressed={selectedBudget === level}
              aria-label={`Budget level ${level}`}
            >
              {'💰'.repeat(level)}
            </button>
          ))}
        </div>
         <p className="text-xs text-gray-500 mt-1">
            (💰 = Budget-friendly, 💰💰 = Mid-range, 💰💰💰 = Open to anything)
        </p>
      </div>

      {/* Navigation */}
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
           onClick={nextSlide} // Call nextSlide now
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlideNew1;