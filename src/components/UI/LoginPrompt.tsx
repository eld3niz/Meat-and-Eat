// src/components/UI/LoginPrompt.tsx
import React from 'react';
import { useModal } from '../../contexts/ModalContext'; // To open the modal

const LoginPrompt: React.FC = () => {
  // Make sure useModal provides openAuthModal with an optional tab argument
  // If not, adjust useModal or AuthModal logic accordingly. Assuming it does for now.
  const { openAuthModal } = useModal();

  const handleLoginClick = () => {
    openAuthModal(); // Open modal (defaults likely to login)
  };

  const handleRegisterClick = () => {
    openAuthModal(); // Open modal (user can switch to register)
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md mx-auto max-w-2xl my-10 border border-gray-200">
      {/* Map Pin Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 mb-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>

      <h2 className="text-3xl font-bold text-gray-800 mb-3">Willkommen bei Meet & Eat!</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
        Entdecke, wo andere essen gehen! Melde dich an oder registriere dich, um die Karte zu sehen und deinen Standort zu teilen.
      </p>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleLoginClick}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          Anmelden
        </button>
        <button
          onClick={handleRegisterClick}
          className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          Konto erstellen
        </button>
      </div>
    </div>
  );
};

export default LoginPrompt;