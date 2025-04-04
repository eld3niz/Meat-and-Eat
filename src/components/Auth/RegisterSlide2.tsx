import React, { useState } from 'react';
import Button from '../UI/Button'; // Import Button component
interface RegisterSlide2Props {
  updateFormData: (data: any) => void;
  prevSlide: () => void;
  handleSubmit: () => Promise<void>; // Added handleSubmit
  isLoading: boolean; // Added isLoading
}

const RegisterSlide2: React.FC<RegisterSlide2Props> = ({ updateFormData, prevSlide, handleSubmit, isLoading }) => { // Destructure new props
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState({
    day: '',
    month: '',
    year: '',
  });
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const validateForm = () => {
    const newErrors: { name?: string; birthDate?: string } = {};

    if (!name) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!birthDate.day || !birthDate.month || !birthDate.year) {
      newErrors.birthDate = 'Geburtsdatum ist erforderlich';
    } else {
      const birthDateObj = new Date(
        Number(birthDate.year),
        Number(birthDate.month) - 1,
        Number(birthDate.day)
      );
      const age = currentYear - Number(birthDate.year);
      const monthDiff = new Date().getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birthDateObj.getDate())) {
        //Age is not yet reached this year
        //age--;
      }
      if (age < 16) {
        newErrors.birthDate = 'Mindestalter ist 16 Jahre';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Renamed handleNext to handleComplete
  const handleComplete = () => {
    if (validateForm()) {
      // Calculate age from birthDate
      const birthDateObj = new Date(
        Number(birthDate.year),
        Number(birthDate.month) - 1,
        Number(birthDate.day)
      );
      // Note: Simple age calculation, might need refinement for exact age based on month/day
      const age = new Date().getFullYear() - birthDateObj.getFullYear();
      updateFormData({ name, age });
      handleSubmit(); // Call handleSubmit instead of nextSlide
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBirthDate({ ...birthDate, [name]: value });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen (5/5)</h2> {/* Update step number */}
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
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            value={birthDate.day}
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
            value={birthDate.month}
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
            value={birthDate.year}
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
      <div className="flex justify-between">
        <button
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          onClick={prevSlide}
        >
          Zurück
        </button>
        {/* Use Button component, update text, handle loading state */}
        <Button
          className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center" // Changed color to green
          onClick={handleComplete} // Call handleComplete
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

export default RegisterSlide2;
