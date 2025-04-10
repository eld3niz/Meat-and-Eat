import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TagInput from '../UI/TagInput'; // Import TagInput
import { cuisineOptions } from '../../data/options'; // Import cuisine options

// Fix default icon issue with Leaflet and bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// --- Props Interface Updated ---
// NOTE: This component now renders the Meetup Creation Form
// It requires onSubmit and userId props. The 'message' prop is no longer used.
interface SimpleMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void; // Required for form submission
  userId: string; // Required for form submission logic
  title?: string; // Optional title, defaults to "Add New Meeting"
}

// --- Helper Components from MeetupFormPopup ---
// Placeholder type for Overpass data
interface OverpassPlace {
    id: number;
    lat: number;
    lon: number;
    tags: {
        name?: string;
        amenity?: string;
        cuisine?: string;
         // Add other relevant tags
    };
}

// Component to handle map click events for custom marker
const MapClickHandler = ({ onMapClick, selectedLocation }: { onMapClick: (latlng: LatLng) => void, selectedLocation: LatLng | null }) => {
    useMapEvents({
        click(e) {
            if (!selectedLocation || selectedLocation.alt === undefined) { // Simple check if it's a custom marker
                 onMapClick(e.latlng);
            }
        },
    });
    return null;
};

// Component to center map on user location
const CenterMapOnUser = ({ position }: { position: LatLngExpression }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(position, 13); // Set view and zoom level
    }, [position, map]);
    return null;
};


// --- Main Component (Modified SimpleMessagePopup) ---
const SimpleMessagePopup: React.FC<SimpleMessagePopupProps> = ({
  isOpen,
  onClose,
  onSubmit, // Added prop
  userId,   // Added prop
  title = "Add New Meeting", // Changed default title
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // --- State Variables from MeetupFormPopup ---
  const [placeName, setPlaceName] = useState('');
  const [meetupDateTime, setMeetupDateTime] = useState<Date | null>(new Date());
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([51.505, -0.09]);
  const [overpassPlaces, setOverpassPlaces] = useState<OverpassPlace[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // --- Effects and Handlers from MeetupFormPopup ---
  // Fetch user's location on mount/open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng = new LatLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(userLatLng);
          setMapCenter(userLatLng);
          setIsLoadingLocation(false);
          console.log("User location fetched:", userLatLng);
          // fetchOverpassData(userLatLng); // Placeholder call
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocation(new LatLng(51.505, -0.09)); // Fallback
          setMapCenter([51.505, -0.09]);
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
        // Reset state when closing
        setPlaceName('');
        setMeetupDateTime(new Date());
        setDescription('');
        setSelectedLocation(null);
        setSelectedCuisines([]);
        setUserLocation(null);
        setMapCenter([51.505, -0.09]);
        setOverpassPlaces([]);
        setIsLoadingLocation(true);
        setShowConfirmation(false);
    }
  }, [isOpen]);

  // Placeholder Overpass fetch
  const fetchOverpassData = async (center: LatLng | LatLngExpression) => {
      console.log("Fetching Overpass data around:", center);
      let lat: number, lng: number;
      if (center instanceof L.LatLng) { lat = center.lat; lng = center.lng; }
      else if (Array.isArray(center)) { [lat, lng] = center; }
      else if (typeof center === 'object' && center !== null && 'lat' in center && 'lng' in center) { lat = (center as L.LatLngLiteral).lat; lng = (center as L.LatLngLiteral).lng; }
      else { console.error("Could not determine center coordinates."); return; }
      setOverpassPlaces([
          { id: 1, lat: lat + 0.01, lon: lng, tags: { name: 'Dummy Restaurant', amenity: 'restaurant' } },
          { id: 2, lat: lat, lon: lng + 0.01, tags: { name: 'Dummy Cafe', amenity: 'cafe' } },
      ]);
  };

  const handleMapClick = (latlng: LatLng) => {
    console.log("Custom marker placed at:", latlng);
    setSelectedLocation(latlng);
    setPlaceName('');
  };

  const handleOverpassMarkerClick = (place: OverpassPlace) => {
    console.log("Overpass marker selected:", place);
    const location = new LatLng(place.lat, place.lon, place.id);
    setSelectedLocation(location);
    setPlaceName(place.tags.name || `Amenity ${place.id}`);
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !meetupDateTime) {
      alert('Please select a location on the map and set a date/time.');
      return;
    }
    if (!placeName && selectedLocation.alt === undefined) {
        alert('Please provide a name for the custom location.');
        return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = () => {
     if (!selectedLocation || !meetupDateTime) return;
    const meetupTitle = placeName || `Meetup @ ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
    const formData = {
      title: meetupTitle,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      meetup_time: meetupDateTime.toISOString(),
      description: description,
      cuisines: selectedCuisines,
    };
    onSubmit(formData); // Use the passed onSubmit prop
    setShowConfirmation(false);
    // onClose(); // Let the calling component handle closing after successful submit
  };

  const handleCancelSubmit = () => {
      setShowConfirmation(false);
  }

  // Handler for TagInput changes
  const handleCuisineChange = (newSelection: string[]) => {
      if (newSelection.length <= 3) {
          setSelectedCuisines(newSelection);
      } else {
          console.warn("Maximum of 3 cuisines allowed.");
      }
  };

  // Close popup when clicking outside the content area (Original handler)
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // --- Return Statement (Merged JSX) ---
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[2000] p-4" // Keep original z-index
      onClick={handleOutsideClick}
    >
      {/* Adjusted container class for form size */}
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative overscroll-contain"
        ref={popupRef}
      >
        {/* Close Button (Original) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Title (Original, uses prop or default) */}
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* --- Content Area Replaced with Form/Confirmation --- */}
        {showConfirmation ? (
            // Confirmation Dialog (from MeetupFormPopup)
            <div className="text-center">
                <p className="mb-4">Are you sure you want to create this meeting?</p>
                <p><strong>Place:</strong> {placeName || `Custom @ ${selectedLocation?.lat.toFixed(4)}, ${selectedLocation?.lng.toFixed(4)}`}</p>
                <p><strong>Date:</strong> {meetupDateTime?.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {meetupDateTime?.toLocaleTimeString()}</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={handleConfirmSubmit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={handleCancelSubmit}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ) : (
            // Form (from MeetupFormPopup)
            <form onSubmit={handleSubmitAttempt}>
              {/* Map */}
              <div className="mb-12">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isLoadingLocation ? (
                   <div className="h-64 md:h-80 flex justify-center items-center bg-gray-100 text-gray-500">Loading map and location...</div>
                ) : (
                  <div className="h-64 md:h-80 relative">
                    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {userLocation && <CenterMapOnUser position={userLocation} />}
                      <MapClickHandler onMapClick={handleMapClick} selectedLocation={selectedLocation} />

                      {/* Custom Marker */}
                      {selectedLocation && selectedLocation.alt === undefined && (
                        <Marker position={selectedLocation}>
                          <Popup>Custom meeting point</Popup>
                        </Marker>
                      )}
                      {/* Overpass Markers (Dummy) */}
                      {overpassPlaces.map(place => (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lon]}
                            eventHandlers={{ click: () => handleOverpassMarkerClick(place) }}
                        >
                            <Popup>
                                <b>{place.tags.name || 'Unnamed Place'}</b><br />
                                {place.tags.amenity || ''} {place.tags.cuisine ? `(${place.tags.cuisine})` : ''}<br/>
                                <button className="text-blue-500 underline text-sm" onClick={(e) => {e.stopPropagation(); handleOverpassMarkerClick(place);}}>Select this place</button>
                            </Popup>
                        </Marker>
                      ))}
                      {/* Selected Overpass Marker */}
                      {selectedLocation && selectedLocation.alt !== undefined && (
                        <Marker position={selectedLocation}>
                            <Popup>Selected: {placeName}</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 mb-8">Click on map to set custom marker or click an existing marker.</p>
              </div>

              {/* Place Name */}
              <div className="mb-6">
                <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                <input
                  type="text"
                  id="placeName"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  required={selectedLocation?.alt === undefined}
                  disabled={selectedLocation?.alt !== undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                  placeholder={selectedLocation?.alt !== undefined ? "Selected from map" : "Enter name if placing custom marker"}
                />
                {selectedLocation?.alt !== undefined && <p className="text-xs text-gray-500 mt-1">Name is set from the selected map marker.</p>}
                {selectedLocation?.alt === undefined && <p className="text-xs text-gray-500 mt-1">Required if placing a custom marker.</p>}
              </div>

              {/* Cuisine Selection */}
              <div className="mb-6">
                <TagInput
                  label="Cuisines (Optional, max 3)"
                  id="meetup-cuisines"
                  options={cuisineOptions}
                  selectedItems={selectedCuisines}
                  onChange={handleCuisineChange}
                  placeholder="Select up to 3 cuisines"
                />
                {selectedCuisines.length >= 3 && (
                   <p className="text-xs text-red-500 mt-1">Maximum of 3 cuisines selected.</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reverted padding */}
                <div className="relative md:col-span-2"> {/* Reverted margin */}
                    <label htmlFor="meetupDate" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <DatePicker
                      id="meetupDate"
                      selected={meetupDateTime}
                      onChange={(date: Date | null) => setMeetupDateTime(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      minDate={new Date()}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex items-center h-10"
                      popperClassName="date-picker-popper z-[1000]"
                      popperPlacement="bottom-start" // Set popper placement
                    />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Intention for the meetup, e.g., 'Casual dinner to discuss local projects'"
                />
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={!selectedLocation || !meetupDateTime}
                >
                  Add Meeting
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default SimpleMessagePopup;