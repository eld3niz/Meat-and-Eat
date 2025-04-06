import React, { useState } from 'react';
import Button from '../UI/Button'; // Assuming a Button component exists

interface RegisterSlideNew1Props {
  updateFormData: (data: { is_local?: string | null; budget?: number | null }) => void;
  prevSlide: () => void;
  handleSubmit: () => Promise<void>; // Added handleSubmit
  isLoading: boolean; // Added isLoading
  currentSlide: number;
  totalSlides: number;
}

const localOptions = ["Local", "Expat", "Tourist", "Other"];

const RegisterSlideNew1: React.FC<RegisterSlideNew1Props> = ({ updateFormData, prevSlide, handleSubmit, isLoading, currentSlide, totalSlides }) => {
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

        {/* Complete Button */}
        <Button
          className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center px-4 py-2 rounded-md min-w-[120px] text-center" // Adjusted width and centering
          onClick={handleSubmit} // Call handleSubmit
          disabled={isLoading} // Disable if loading
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Wird verarbeitet...
            </>
          ) : (
            'Abschließen' // Changed text to "Complete"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlideNew1;