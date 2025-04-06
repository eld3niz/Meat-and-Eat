import React, { useState } from 'react';
import Button from '../UI/Button'; // Assuming a Button component exists

interface RegisterSlideNew2Props {
  updateFormData: (data: { bio?: string }) => void;
  nextSlide: () => void;
  // prevSlide is removed for the first slide
  currentSlide: number;
  totalSlides: number;
}

const MAX_BIO_LENGTH = 255;

const RegisterSlideNew2: React.FC<RegisterSlideNew2Props> = ({ updateFormData, nextSlide, currentSlide, totalSlides }) => {
  const [bio, setBio] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_BIO_LENGTH) {
      setBio(text);
      setCharCount(text.length);
      updateFormData({ bio: text });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">Your Bio</h2>
      <p className="text-sm text-gray-500">
        Share something about yourself. Filling this in leads to more meet up success! (Optional)
      </p>

      {/* Bio Textarea */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Bio (Max {MAX_BIO_LENGTH} characters)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={bio}
          onChange={handleBioChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          placeholder="Tell us about your interests, what you're looking for, etc."
        />
        <p className="text-right text-xs text-gray-500 mt-1">
          {charCount}/{MAX_BIO_LENGTH}
        </p>
      </div>

      {/* Slide Indicator and Navigation */}
      <div className="flex items-center justify-between pt-4">
        {/* Placeholder for Back button alignment */}
        <div className="w-20"></div>
        
        {/* Slide Indicator */}
        <span className="text-sm text-gray-500">
          Slide {currentSlide + 1} / {totalSlides}
        </span>

        {/* Next Button */}
        <Button onClick={nextSlide}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlideNew2;