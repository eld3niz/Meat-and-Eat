import React, { useRef } from 'react';

interface SimpleMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // Optional title
  message: string; // Message to display
}

const SimpleMessagePopup: React.FC<SimpleMessagePopupProps> = ({
  isOpen,
  onClose,
  title = "Notification", // Default title
  message,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside the content area
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[2000] p-4" // Significantly increased z-index
      onClick={handleOutsideClick}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm relative" // Smaller max-width
        ref={popupRef}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        {/* Message */}
        <p className="text-gray-700">{message}</p>

        {/* Optional: Add an OK button if needed */}
        {/* <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            OK
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default SimpleMessagePopup;