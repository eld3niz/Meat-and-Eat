import React, { useState } from 'react';
import Button from '../UI/Button';
import LocationSearchMap from '../Map/LocationSearchMap'; // Import the map component

interface RegisterSlideNew1Props {
  // Add formData prop
  formData: { budget: number | null; home_latitude: number | null; home_longitude: number | null };
  updateFormData: (data: { home_latitude?: number | null; home_longitude?: number | null; budget?: number | null }) => void;
  prevSlide: () => void;
  nextSlide: () => void;
  currentSlide: number;
  totalSlides: number;
}

// Removed localOptions

// Add formData to destructuring
const RegisterSlideNew1: React.FC<RegisterSlideNew1Props> = ({ formData, updateFormData, prevSlide, nextSlide, currentSlide, totalSlides }) => {
  // Remove local selectedBudget state

  // Handler for when a location is selected on the map
  const handleLocationSelect = (lat: number, lng: number) => {
    updateFormData({ home_latitude: lat, home_longitude: lng });
  };

  const handleBudgetClick = (budgetLevel: number) => {
    // Use formData.budget for comparison
    const newBudget = formData.budget === budgetLevel ? null : budgetLevel;
    // Remove setSelectedBudget call
    updateFormData({ budget: newBudget }); // Update parent state
  };

  return (
    <div className="space-y-6">
      {/* Update step number */}
      <h2 className="text-xl font-semibold text-gray-700">Über dich</h2>
      <p className="text-sm text-gray-500">
        Tell us a bit more. Filling this in leads to more meet up success! (Optional)
      </p>

      {/* Home Location Map Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Set Your Home Location (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Search for your city or address, or click on the map. This helps determine if you're a 'Local' or 'Traveller' based on your current distance when using the app. You can skip this for now.
        </p>
        <LocationSearchMap
          // Pass initial coordinates from formData to the map
          initialLat={formData.home_latitude}
          initialLng={formData.home_longitude}
          onLocationSelect={handleLocationSelect}
          mapHeight="250px"
        />
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
                // Use formData.budget for styling
                formData.budget === level
                  ? 'bg-yellow-300 scale-110 shadow-lg'
                  : 'bg-gray-200 hover:bg-gray-300 scale-100'
              }`}
              // Use formData.budget for aria-pressed
              aria-pressed={formData.budget === level}
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
           className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-2 rounded-md w-20 flex items-center justify-center" // Added flex for centering
           onClick={nextSlide} // Call nextSlide now
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlideNew1;