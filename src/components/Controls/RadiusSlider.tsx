import React from 'react';

const RadiusSlider = ({ value, onChange, markersInRange }) => {
  return (
    <div className="radius-slider-container">
      <input
        type="range"
        min="1"
        max="50"
        value={value}
        onChange={onChange}
        className="radius-slider"
      />
      <div className="radius-display">
        {value} km
      </div>
      
      {/* Add a message when no markers are in range */}
      {markersInRange === 0 && (
        <div className="text-red-500 text-sm mt-1">
          Keine Restaurants in diesem Umkreis gefunden
        </div>
      )}
    </div>
  );
};

export default RadiusSlider;