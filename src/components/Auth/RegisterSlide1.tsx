import React, { useState } from 'react';

interface RegisterSlide1Props {
  updateFormData: (data: any) => void;
  nextSlide: () => void;
}

const RegisterSlide1: React.FC<RegisterSlide1Props> = ({ updateFormData, nextSlide }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }

    if (!password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateFormData({ email, password });
      nextSlide();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Konto erstellen (1/4)</h2>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        <p className="mt-1 text-xs text-gray-500">Passwort muss mindestens 8 Zeichen lang sein.</p>
      </div>
      <button
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={handleNext}
      >
        Weiter
      </button>
    </div>
  );
};

export default RegisterSlide1;
