import React, { useState } from 'react';

interface TagInputProps {
  label: string;
  id: string;
  options: string[];
  selectedItems: string[];
  onChange: (newItems: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  id,
  options,
  selectedItems,
  onChange,
  placeholder = "Select an option",
}) => {
  const [currentItem, setCurrentItem] = useState('');

  const addItem = () => {
    if (currentItem && !selectedItems.includes(currentItem)) {
      const newItems = [...selectedItems, currentItem];
      onChange(newItems); // Notify parent of the change
      setCurrentItem(''); // Reset dropdown
    }
  };

  const removeItem = (itemToRemove: string) => {
    const newItems = selectedItems.filter((item) => item !== itemToRemove);
    onChange(newItems); // Notify parent of the change
  };

  // Filter out already selected options from the dropdown
  const availableOptions = options.filter(opt => !selectedItems.includes(opt));

  return (
    <div className="mb-3"> {/* Use consistent margin like other filters */}
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2"> {/* Use consistent gap */}
        {selectedItems.map((item) => (
          <div key={item} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs inline-flex items-center"> {/* Adjusted padding/text size */}
            {item}
            <button
              type="button"
              className="ml-1.5 focus:outline-none" // Adjusted margin
              onClick={() => removeItem(item)}
              aria-label={`Remove ${item}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Adjusted size */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex">
        <select
          id={id}
          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Adjusted padding/text size
          value={currentItem}
          onChange={(e) => setCurrentItem(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {availableOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ml-2 bg-blue-600 text-white py-1 px-3 rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50" // Adjusted padding/text size
          onClick={addItem}
          disabled={!currentItem} // Disable if no item is selected in dropdown
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default TagInput;