import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Ensure CSS is imported

// Define types for filters (consider moving to a shared types file)
export interface MeetupFiltersType {
    minAge: number | null;
    maxAge: number | null;
    gender: string | null; // e.g., 'male', 'female', 'any'
    languages: string[]; // Array of selected language strings
    travelStatus: string | null; // e.g., 'home', 'traveling', 'any'
    maxDistance: number | null; // in km
    dateRangeStart: Date | null;
    dateRangeEnd: Date | null;
    timeRangeStart: string | null; // e.g., "18:00"
    timeRangeEnd: string | null; // e.g., "22:00"
}

interface MeetupFiltersProps {
    availableLanguages: string[]; // Pass available languages from data
    onFilterChange: (filters: MeetupFiltersType) => void;
}

// Helper options
const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18); // Ages 18-100
const genderOptions = [
    { value: null, label: 'Any Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    // Add 'divers' or other options if needed based on profile data
];
const travelStatusOptions = [
    { value: null, label: 'Any Status' },
    { value: 'home', label: 'At Home' },
    { value: 'traveling', label: 'Traveling' },
];
const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { value: timeString, label: timeString };
});


const MeetupFilters: React.FC<MeetupFiltersProps> = ({ availableLanguages, onFilterChange }) => {
    const [filters, setFilters] = useState<MeetupFiltersType>({
        minAge: null,
        maxAge: null,
        gender: null,
        languages: [],
        travelStatus: null,
        maxDistance: null,
        dateRangeStart: null,
        dateRangeEnd: null,
        timeRangeStart: null,
        timeRangeEnd: null,
    });

    // Memoize language options for react-select
    const languageSelectOptions = useMemo(() => {
        return availableLanguages.map(lang => ({ value: lang, label: lang }));
    }, [availableLanguages]);

    // Handler to update filters and call parent callback
    const handleFilterUpdate = (updatedFilters: Partial<MeetupFiltersType>) => {
        const newFilters = { ...filters, ...updatedFilters };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    // Specific handlers for complex inputs
    const handleLanguageChange = (selectedOptions: any) => {
        handleFilterUpdate({ languages: selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [] });
    };

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        handleFilterUpdate({ dateRangeStart: start, dateRangeEnd: end });
    };


    return (
        <div className="p-4 bg-gray-50 rounded-md mb-4 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
                {/* Age Range */}
                <div className="flex gap-2 items-end">
                    <div>
                        <label htmlFor="minAge" className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                        <select
                            id="minAge"
                            value={filters.minAge ?? ''}
                            onChange={(e) => handleFilterUpdate({ minAge: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Any</option>
                            {ageOptions.map(age => (
                                <option key={age} value={age} disabled={!!filters.maxAge && age > filters.maxAge}>{age}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                        <select
                            id="maxAge"
                            value={filters.maxAge ?? ''}
                            onChange={(e) => handleFilterUpdate({ maxAge: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Any</option>
                            {ageOptions.map(age => (
                                <option key={age} value={age} disabled={!!filters.minAge && age < filters.minAge}>{age}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Gender */}
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                        id="gender"
                        value={filters.gender ?? ''}
                        onChange={(e) => handleFilterUpdate({ gender: e.target.value || null })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {genderOptions.map(opt => (
                            <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                 {/* Languages */}
                 <div>
                    <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                    <Select
                        id="languages"
                        isMulti
                        options={languageSelectOptions}
                        value={languageSelectOptions.filter(opt => filters.languages.includes(opt.value))}
                        onChange={handleLanguageChange}
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Any Language..."
                    />
                </div>

                 {/* Travel Status */}
                 <div>
                    <label htmlFor="travelStatus" className="block text-sm font-medium text-gray-700 mb-1">Travel Status</label>
                    <select
                        id="travelStatus"
                        value={filters.travelStatus ?? ''}
                        onChange={(e) => handleFilterUpdate({ travelStatus: e.target.value || null })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {travelStatusOptions.map(opt => (
                            <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Max Distance */}
                <div>
                    <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700 mb-1">Max Distance (km)</label>
                    <input
                        type="number"
                        id="maxDistance"
                        min="0"
                        value={filters.maxDistance ?? ''}
                        onChange={(e) => handleFilterUpdate({ maxDistance: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Any"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Date Range */}
                <div className="relative z-[5]"> {/* Increased z-index for date picker */}
                    <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <DatePicker
                        id="dateRange"
                        selectsRange={true}
                        startDate={filters.dateRangeStart}
                        endDate={filters.dateRangeEnd}
                        onChange={handleDateChange}
                        isClearable={true}
                        placeholderText="Any Date"
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        popperClassName="react-datepicker-high-z" // Use high z-index class
                    />
                </div>

                 {/* Time Range */}
                 <div className="flex gap-2 items-end">
                    <div>
                        <label htmlFor="timeRangeStart" className="block text-sm font-medium text-gray-700 mb-1">From Time</label>
                        <select
                            id="timeRangeStart"
                            value={filters.timeRangeStart ?? ''}
                            onChange={(e) => handleFilterUpdate({ timeRangeStart: e.target.value || null })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Any</option>
                            {timeOptions.map(opt => (
                                <option key={opt.value} value={opt.value} disabled={!!filters.timeRangeEnd && opt.value >= filters.timeRangeEnd}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="timeRangeEnd" className="block text-sm font-medium text-gray-700 mb-1">To Time</label>
                        <select
                            id="timeRangeEnd"
                            value={filters.timeRangeEnd ?? ''}
                            onChange={(e) => handleFilterUpdate({ timeRangeEnd: e.target.value || null })}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Any</option>
                             {timeOptions.map(opt => (
                                <option key={opt.value} value={opt.value} disabled={!!filters.timeRangeStart && opt.value <= filters.timeRangeStart}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MeetupFilters;

// Add basic styling for react-select to fit in
const customStyles = `
.react-select-container .react-select__control {
  min-height: 30px; /* Adjust height */
  border-color: #d1d5db; /* Match Tailwind gray-300 */
  box-shadow: none; /* Remove default shadow */
}
.react-select-container .react-select__control--is-focused {
  border-color: #6366f1; /* Match Tailwind indigo-500 */
  box-shadow: 0 0 0 1px #6366f1;
}
.react-select-container .react-select__value-container {
  padding: 0 6px;
}
.react-select-container .react-select__indicators {
  height: 30px;
}
.react-select-container .react-select__indicator-separator {
  display: none;
}
.react-select-container .react-select__indicator {
  padding: 4px;
}
.react-select-container .react-select__menu {
    z-index: 20; /* Ensure dropdown is above other elements */
}
`;

// Inject styles - simple approach for now
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = customStyles;
document.head.appendChild(styleSheet);