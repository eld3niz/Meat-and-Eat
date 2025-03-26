import React, { useState } from 'react';
import RegisterSlide1 from './RegisterSlide1';
import RegisterSlide2 from './RegisterSlide2';
import RegisterSlide3 from './RegisterSlide3';
import DotIndicator from './DotIndicator';

const MultiStepRegisterForm: React.FC = () => {
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

  const nextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide - 1);
  };

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const handleSubmit = () => {
    // For now, just log the data
    console.log('Registration Data:', formData);
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return <RegisterSlide1 updateFormData={updateFormData} nextSlide={nextSlide} />;
      case 1:
        return <RegisterSlide2 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} />;
      case 2:
        return <RegisterSlide3 updateFormData={updateFormData} prevSlide={prevSlide} handleSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <DotIndicator currentSlide={currentSlide} totalSlides={3} />
      <div className="mt-4">
        {renderSlide()}
      </div>
    </div>
  );
};

export default MultiStepRegisterForm;
