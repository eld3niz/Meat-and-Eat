import React, { useState } from 'react';
import Button from '../UI/Button'; // Import Button component
interface RegisterSlide2Props {
  // Update formData prop type for birth date components
  formData: { name: string; birthDay: string; birthMonth: string; birthYear: string };
  // Update updateFormData prop type
  updateFormData: (data: { name?: string; birthDay?: string; birthMonth?: string; birthYear?: string }) => void;
  prevSlide: () => void;
  nextSlide: () => void;
  currentSlide: number;
  totalSlides: number;
}

const RegisterSlide2: React.FC<RegisterSlide2Props> = ({ formData, updateFormData, prevSlide, nextSlide, currentSlide, totalSlides }) => {
  // Remove local birthDate state
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const validateForm = () => {
    const newErrors: { name?: string; birthDate?: string } = {};

    if (!formData.name) { // Validate using formData prop
      newErrors.name = 'Name ist erforderlich';
    }

    // Validate using formData props for birth date
    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      newErrors.birthDate = 'Vollständiges Geburtsdatum ist erforderlich';
    } else {
      try {
        const yearNum = parseInt(formData.birthYear);
        const monthNum = parseInt(formData.birthMonth);
        const dayNum = parseInt(formData.birthDay);
        const birthDateObj = new Date(yearNum, monthNum - 1, dayNum);

        // Check if date is valid (e.g., Feb 30) and components match
        if (!(birthDateObj.getFullYear() === yearNum && birthDateObj.getMonth() === monthNum - 1 && birthDateObj.getDate() === dayNum)) {
            newErrors.birthDate = 'Ungültiges Datum';
        } else {
            // Check age
            let age = new Date().getFullYear() - birthDateObj.getFullYear();
            const monthDiff = new Date().getMonth() - birthDateObj.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birthDateObj.getDate())) {
                age--;
            }
            if (age < 16) {
                newErrors.birthDate = 'Mindestalter ist 16 Jahre';
            }
        }
      } catch (e) {
          newErrors.birthDate = 'Ungültiges Datumformat';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle moving to the next slide
  const handleNext = () => {
    // Only validate, updateFormData is now called in onChange handlers
    if (validateForm()) {
       nextSlide();
    }
  };

  // Update parent state directly when a date component changes
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name: fieldName, value } = e.target;
    let updateKey: 'birthDay' | 'birthMonth' | 'birthYear' | null = null;

    if (fieldName === 'day') {
      updateKey = 'birthDay';
    } else if (fieldName === 'month') {
      updateKey = 'birthMonth';
    } else if (fieldName === 'year') {
      updateKey = 'birthYear';
    }

    if (updateKey) {
      updateFormData({ [updateKey]: value });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Persönliche Angaben</h2>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          value={formData.name} // Use formData prop for value
          onChange={(e) => updateFormData({ name: e.target.value })} // Update parent state directly
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div className="mb-6">
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
          Geburtsdatum
        </label>
        <div className="flex gap-2">
          <select
            id="day"
            name="day"
            className="w-1/3 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.birthDay} // Use formData prop for value
            onChange={handleBirthDateChange}
          >
            <option value="">Tag</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <select
            id="month"
            name="month"
            className="w-1/3 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.birthMonth} // Use formData prop for value
            onChange={handleBirthDateChange}
          >
            <option value="">Monat</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <select
            id="year"
            name="year"
            className="w-1/3 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.birthYear} // Use formData prop for value
            onChange={handleBirthDateChange}
          >
            <option value="">Jahr</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
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
           className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-2 rounded-md w-20 flex items-center justify-center" // Added flex for centering
           onClick={handleNext} // Call handleNext
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlide2;
