import React, { useState, useCallback } from 'react';
import AvatarUpload from './AvatarUpload'; // Reuse the component

interface RegisterSlideAvatarProps {
  updateFormData: (data: { avatarFile?: File | null }) => void; // Pass the File object
  // nextSlide removed as this is the last slide
  prevSlide: () => void;
  handleSubmit: () => Promise<void>; // Added for final submission
  isLoading: boolean; // Added for loading state on submit
  currentSlide: number;
  totalSlides: number;
}

const RegisterSlideAvatar: React.FC<RegisterSlideAvatarProps> = ({
  updateFormData,
  // nextSlide removed
  prevSlide,
  handleSubmit, // Added
  isLoading, // Added
  currentSlide,
  totalSlides,
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

  // Renamed to handleComplete for clarity as it's the final step
  const handleComplete = () => {
    // Optional: Add validation if an avatar is mandatory
    // if (!avatarFile) {
    //   setError('Please select a profile picture.');
    //   return;
    // }
    // No need to updateFormData here as it's done in handleAvatarSelect
    handleSubmit(); // Call the submit handler passed from the parent
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

      {/* Slide Indicator and Navigation */}
      <div className="flex items-center justify-between mt-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400 px-4 py-2 rounded-md w-20 text-center" // Consistent back button style
        >
          Zurück
        </button>

        {/* Slide Indicator */}
        <span className="text-sm text-gray-500">
          Slide {currentSlide + 1} / {totalSlides}
        </span>

        {/* Complete Button */}
        <button
          type="button"
          onClick={handleComplete} // Call handleComplete
          disabled={isLoading}
          className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center px-4 py-2 rounded-md min-w-[120px] text-center" // Style from original complete button
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Wird verarbeitet...
            </>
          ) : (
            'Registrierung abschließen'
          )}
        </button>
      </div>
    </div>
  );
};

export default RegisterSlideAvatar;