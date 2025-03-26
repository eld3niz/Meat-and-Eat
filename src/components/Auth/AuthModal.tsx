import { useState, useEffect, useRef } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import MultiStepRegisterForm from './MultiStepRegisterForm'; // Import the new component

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Schließe das Modal beim Klicken außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Schließe das Modal mit ESC-Taste
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      // Verhindere das Scrollen des Hintergrunds wenn Modal geöffnet ist
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium text-sm focus:outline-none ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('login')}
            role="tab"
            aria-selected={activeTab === 'login'}
            tabIndex={activeTab === 'login' ? 0 : -1}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium text-sm focus:outline-none ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('register')}
            role="tab"
            aria-selected={activeTab === 'register'}
            tabIndex={activeTab === 'register' ? 0 : -1}
          >
            Register
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {activeTab === 'login' ? (
            <LoginForm onSuccess={onClose} />
          ) : (
            <MultiStepRegisterForm /> // Use the new multi-step form
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 text-right">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
