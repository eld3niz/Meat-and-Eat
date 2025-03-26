import React, { useState } from 'react';

interface RegisterSlide2Props {
  updateFormData: (data: any) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

const RegisterSlide2: React.FC<RegisterSlide2Props> = ({ updateFormData, nextSlide, prevSlide }) => {
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

  const handleNext = () => {
    if (validateForm()) {
      // Calculate age from birthDate
      const birthDateObj = new Date(
        Number(birthDate.year),
        Number(birthDate.month) - 1,
        Number(birthDate.day)
      );
      const age = new Date().getFullYear() - birthDateObj.getFullYear();
      updateFormData({ name, age });
      nextSlide();
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBirthDate({ ...birthDate, [name]: value });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen (2/3)</h2>
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

export default RegisterSlide2;
