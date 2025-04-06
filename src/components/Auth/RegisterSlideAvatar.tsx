import React, { useState, useCallback } from 'react';
import AvatarUpload from './AvatarUpload'; // Reuse the component

interface RegisterSlideAvatarProps {
  updateFormData: (data: { avatarFile?: File | null }) => void; // Pass the File object
  nextSlide: () => void;
  prevSlide: () => void;
}

const RegisterSlideAvatar: React.FC<RegisterSlideAvatarProps> = ({
  updateFormData,
  nextSlide,
  prevSlide,
}) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear previous errors
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Basic validation (optional: add more checks like file type/size)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please select a PNG, JPG, or GIF image.');
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB limit (adjust as needed)
      if (file.size > maxSize) {
        setError('File is too large. Maximum size is 5MB.');
        return;
      }

      setAvatarFile(file);
      updateFormData({ avatarFile: file }); // Update form data with the File object

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle case where selection is cancelled
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      updateFormData({ avatarFile: null });
      setError(null);
    }
     // Reset input value to allow selecting the same file again if needed
     event.target.value = '';
  }, [updateFormData]);

  const handleNext = () => {
    // You could add validation here if an avatar is mandatory
    // if (!avatarFile) {
    //   setError('Please select a profile picture.');
    //   return;
    // }
    nextSlide();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-gray-700">Upload Your Avatar (Optional)</h2>

      <AvatarUpload
        avatarUrl={avatarPreviewUrl} // Show preview
        uploading={false} // Not uploading yet
        onUpload={handleAvatarSelect}
        size={180} // Slightly larger for registration?
      />

      {error && (
        <p className="text-sm text-red-600 text-center mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 text-center">
        Choose a picture that represents you! Max size: 5MB.
      </p>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={prevSlide}
          className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition duration-150"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext} // Use custom handler for potential validation
          className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RegisterSlideAvatar;