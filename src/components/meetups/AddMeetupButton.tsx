import React from 'react';

interface AddMeetupButtonProps {
  onAddClick: () => void;
}

const AddMeetupButton: React.FC<AddMeetupButtonProps> = ({ onAddClick }) => {
  return (
    <button
      onClick={onAddClick}
      className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      + Add Meeting
    </button>
  );
};

export default AddMeetupButton;