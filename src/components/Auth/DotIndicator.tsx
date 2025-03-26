import React from 'react';

interface DotIndicatorProps {
  currentSlide: number;
  totalSlides: number;
}

const DotIndicator: React.FC<DotIndicatorProps> = ({ currentSlide, totalSlides }) => {
  return (
    <div className="flex justify-center">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-full mx-1 ${
            index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default DotIndicator;
