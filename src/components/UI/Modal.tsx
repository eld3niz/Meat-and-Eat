import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string; // Optional title
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        {/* Optional Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Optional Title */}
        {title && (
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
        )}

        {/* Modal Content */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;