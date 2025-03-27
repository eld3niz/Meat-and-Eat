import React, { useState } from 'react';
import RegisterSlide1 from './RegisterSlide1';
import RegisterSlide2 from './RegisterSlide2';
import RegisterSlide3 from './RegisterSlide3';
import DotIndicator from './DotIndicator';
import supabase from '../../utils/supabaseClient';

interface MultiStepRegisterFormProps {
  onSuccess?: () => void;
}

const MultiStepRegisterForm: React.FC<MultiStepRegisterFormProps> = ({ onSuccess }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    languages: [],
    cuisines: [],
    locationAccess: false,
    city: '',
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

      // Step 2: Insert additional profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          age: parseInt(formData.age) || null,
          languages: formData.languages,
          cuisines: formData.cuisines,
          city: formData.city,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      console.log('Registration successful:', authData.user);
      
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
    switch (currentSlide) {
      case 0:
        return <RegisterSlide1 updateFormData={updateFormData} nextSlide={nextSlide} />;
      case 1:
        return <RegisterSlide2 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} />;
      case 2:
        return (
          <RegisterSlide3 
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
      <DotIndicator currentSlide={currentSlide} totalSlides={3} />
      
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
