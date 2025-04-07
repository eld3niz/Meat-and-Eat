import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import MultiStepRegisterForm from './MultiStepRegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const modalRef = useRef<HTMLDivElement>(null);

  // Set the active tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close modal with ESC key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Define the success handler for registration
  const handleRegisterSuccess = useCallback(() => {
    onClose(); // Close the modal
    // Navigate to map page
    window.history.pushState({}, '', '/');
    const navigationEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navigationEvent);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center">
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
            <MultiStepRegisterForm onSuccess={handleRegisterSuccess} />
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
