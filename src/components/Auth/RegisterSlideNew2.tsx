import React, { useState } from 'react';
import Button from '../UI/Button'; // Assuming a Button component exists

interface RegisterSlideNew2Props {
  updateFormData: (data: { bio?: string }) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

const MAX_BIO_LENGTH = 255;

const RegisterSlideNew2: React.FC<RegisterSlideNew2Props> = ({ updateFormData, nextSlide, prevSlide }) => {
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

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {/* Apply secondary button styles via className */}
        <Button
          onClick={prevSlide}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400"
        >
          Back
        </Button>
        <Button onClick={nextSlide}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default RegisterSlideNew2;