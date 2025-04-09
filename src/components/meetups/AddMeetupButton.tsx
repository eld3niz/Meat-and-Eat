import React from 'react';

interface AddMeetupButtonProps {
  onAddClick: () => void;
}

const AddMeetupButton: React.FC<AddMeetupButtonProps> = ({ onAddClick }) => {
  return (
    <div className="flex justify-center mb-4">
      <button
        onClick={onAddClick}
        className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-bold"
      >
        + Add Meeting
      </button>
    </div>
  );
};

export default AddMeetupButton;