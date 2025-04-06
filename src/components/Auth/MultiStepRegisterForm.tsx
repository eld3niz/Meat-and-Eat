import React, { useState } from 'react';
// Import original slides
import RegisterSlide1 from './RegisterSlide1';
import RegisterSlide2 from './RegisterSlide2';
import RegisterSlide3 from './RegisterSlide3';
// Import new slides
import RegisterSlideNew1 from './RegisterSlideNew1';
import RegisterSlideNew2 from './RegisterSlideNew2';
import DotIndicator from './DotIndicator';
import supabase from '../../utils/supabaseClient';

interface MultiStepRegisterFormProps {
  onSuccess?: () => void;
}

const MultiStepRegisterForm: React.FC<MultiStepRegisterFormProps> = ({ onSuccess }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    // Existing fields
    email: '',
    password: '',
    name: '',
    age: '',
    languages: [] as string[], // Added type for clarity
    cuisines: [] as string[], // Added type for clarity
    locationAccess: false,
    city: '',
    // New fields
    is_local: null as string | null,
    budget: null as number | null,
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide - 1);
  };

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Sign up with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      
      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Step 2: Update the profile with user data
      // We'll use upsert instead of insert to handle both create and update cases
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          // Existing fields
          name: formData.name,
          age: parseInt(formData.age) || null,
          languages: formData.languages,
          cuisines: formData.cuisines,
          city: formData.city,
          // New fields
          is_local: formData.is_local,
          budget: formData.budget,
          bio: formData.bio,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile error details:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // console.log('Registration successful:', authData.user);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSlide = () => {
    // Desired slide order: 3, 4, 5, 1, 2
    switch (currentSlide) {
      case 0: // Original Slide 3: Languages/Cuisines/City
        return <RegisterSlide3 updateFormData={updateFormData} nextSlide={nextSlide} />;
      case 1: // New Slide 1: Local Status & Budget
        return <RegisterSlideNew1 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} />;
      case 2: // New Slide 2: Bio
        return <RegisterSlideNew2 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} />;
      case 3: // Original Slide 1: Email/Password
        return <RegisterSlide1 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} />;
      case 4: // Original Slide 2: Name/Age + Submit
        return (
          <RegisterSlide2
            updateFormData={updateFormData}
            prevSlide={prevSlide}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Update totalSlides to 5 */}
      <DotIndicator currentSlide={currentSlide} totalSlides={5} />
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md" role="alert">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        {renderSlide()}
      </div>
    </div>
  );
};

export default MultiStepRegisterForm;
