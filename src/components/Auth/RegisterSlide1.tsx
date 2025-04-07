import React, { useState } from 'react';
import Button from '../UI/Button'; // Import Button component

interface RegisterSlide1Props {
  formData: { email: string; password: string }; // Accept formData from parent
  updateFormData: (data: { email?: string; password?: string }) => void;
  nextSlide: () => void;
  prevSlide?: () => void; // Optional, as this can be the first slide
  currentSlide: number;
  totalSlides: number;
}

// Remove prevSlide from destructuring as it's optional and not used when it's the first slide
const RegisterSlide1: React.FC<RegisterSlide1Props> = ({ formData, updateFormData, nextSlide, currentSlide, totalSlides }) => {
  // Remove local state for email and password
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) { // Validate using formData prop
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) { // Validate using formData prop
      newErrors.email = 'Ungültiges E-Mail-Format';
    }

    if (!formData.password) { // Validate using formData prop
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) { // Validate using formData prop
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Only validate, updateFormData is now called in onChange
    if (validateForm()) {
      nextSlide();
    }
  };

  return (
    <div>
      {/* Update step number */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen</h2>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <input
          type="email"
          id="email"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          value={formData.email} // Use formData prop for value
          onChange={(e) => updateFormData({ email: e.target.value })} // Update parent state directly
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <input
          type="password"
          id="password"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          value={formData.password} // Use formData prop for value
          onChange={(e) => updateFormData({ password: e.target.value })} // Update parent state directly
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        <p className="mt-1 text-xs text-gray-500">Passwort muss mindestens 8 Zeichen lang sein.</p>
      </div>
      {/* Slide Indicator and Navigation */}
      <div className="flex items-center justify-between pt-4">
         {/* Back Button Placeholder - Keep layout consistent */}
         {/* Render an empty div or similar to maintain spacing if needed, or adjust flex layout */}
         <div className="w-20"></div> {/* Empty div to maintain spacing */}

        {/* Slide Indicator */}
        <span className="text-sm text-gray-500">
          Slide {currentSlide + 1} / {totalSlides}
        </span>

        {/* Next Button */}
        <Button
           className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-2 rounded-md w-20 flex items-center justify-center" // Added flex for centering
           onClick={handleNext}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlide1;
