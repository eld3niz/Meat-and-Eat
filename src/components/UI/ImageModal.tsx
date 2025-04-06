import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface ImageModalProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) {
    return null;
  }

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300"
      onClick={onClose} // Close modal on overlay click
    >
      <div
        className="relative bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside the image/modal content
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl z-10 bg-white rounded-full p-1"
          aria-label="Close image viewer"
        >
          <FaTimes />
        </button>
        <img
          src={imageUrl}
          alt="Full size profile"
          className="max-w-full max-h-full object-contain" // Ensure image fits within modal bounds
        />
      </div>
    </div>
  );
};

export default ImageModal;