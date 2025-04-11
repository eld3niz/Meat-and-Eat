import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TagInput from './TagInput'; // Import TagInput (Corrected path)
import { cuisineOptions } from '../../data/options'; // Import cuisine options
import supabase from '../../utils/supabaseClient'; // Import Supabase client

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
  userName?: string | null; // Optional: Name of the user being invited
  user?: any; // Add user prop to avoid using useAuth
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
      // Allow placing custom marker only if an Overpass place isn't selected
      if (!selectedLocation || selectedLocation.alt === undefined) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Component to handle map move events for fetching data
const MapMoveHandler = ({ onMoveEnd }: { onMoveEnd: (map: L.Map) => void }) => {
  const map = useMap();
  useMapEvents({
    moveend() {
      onMoveEnd(map);
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
  userName, // Added prop
  user, // Accept user prop
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [submitError, setSubmitError] = useState<string | null>(null); // State for submission error

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
  const [isLoadingOverpass, setIsLoadingOverpass] = useState(false); // State for Overpass loading

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
          // fetchOverpassData(userLatLng); // Placeholder call -> Will be triggered by map move/center
        }, // Removed comma
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
        setIsSubmitting(false); // Reset submitting state
        setSubmitError(null); // Reset error state
    }
  }, [isOpen]);

  // Placeholder Overpass fetch
  const fetchOverpassData = async (center: LatLng | LatLngExpression) => {
    // Use map bounds instead of just center for a better query
    // This function will now be called by MapMoveHandler with the map instance
  };

  // Fetch Overpass data based on map bounds
  const fetchOverpassDataForBounds = async (map: L.Map) => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      console.log("Fetching Overpass data for bounds:", bbox);
      setIsLoadingOverpass(true);
      setOverpassPlaces([]); // Clear previous places

      // Overpass QL query for food/drink related places
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|biergarten"](${bbox});
          way["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|biergarten"](${bbox});
          relation["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|biergarten"](${bbox});
          node["shop"~"convenience|supermarket|bakery|pastry|deli|greengrocer|butcher"](${bbox});
          way["shop"~"convenience|supermarket|bakery|pastry|deli|greengrocer|butcher"](${bbox});
          relation["shop"~"convenience|supermarket|bakery|pastry|deli|greengrocer|butcher"](${bbox});
        );
        out center;
      `;

      const overpassUrl = 'https://overpass-api.de/api/interpreter';

      try {
          const response = await fetch(overpassUrl, {
              method: 'POST',
              body: query
          });
          if (!response.ok) {
              throw new Error(`Overpass API error: ${response.statusText}`);
          }
          const data = await response.json();
          console.log("Overpass response:", data);

          // Process elements (nodes, ways, relations)
          const places: OverpassPlace[] = data.elements.map((element: any) => ({
              id: element.id,
              // Use 'center' for ways/relations, 'lat/lon' for nodes
              lat: element.center?.lat ?? element.lat,
              lon: element.center?.lon ?? element.lon,
              tags: element.tags || {},
          })).filter((place: OverpassPlace) => place.lat && place.lon); // Ensure coordinates exist

          console.log("Processed places:", places);
          setOverpassPlaces(places);

      } catch (error) {
          console.error("Failed to fetch Overpass data:", error);
          // Optionally set an error state here to show a message to the user
      } finally {
          setIsLoadingOverpass(false);
      }
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

  const handleConfirmSubmit = async () => {
    if (!selectedLocation || !meetupDateTime || !user) {
        setSubmitError("Missing required information or user not logged in.");
        return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const proposalPayload = {
      sender_id: user.id, // Logged-in user is the sender
      recipient_id: userId, // The ID passed as prop is the recipient
      place_name: placeName || `Custom @ ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      meetup_time: meetupDateTime.toISOString(),
      description: description || null,
      status: 'pending', // Initial status
      // created_at and updated_at are handled by the database default/trigger
    };

    try {
        console.log("Attempting to insert proposal:", proposalPayload);
        const { error } = await supabase
            .from('meetup_proposals')
            .insert([proposalPayload]);

        if (error) {
            console.error("Error inserting proposal:", error);
            throw error; // Throw error to be caught below
        }

        console.log("Proposal inserted successfully!");
        // Optionally show a success message to the user here

        // Close the confirmation and the popup on success
        setShowConfirmation(false);
        onClose();

    } catch (error: any) {
        console.error("Submission failed:", error);
        setSubmitError(`Failed to send proposal: ${error.message || 'Please try again.'}`);
        // Keep the confirmation dialog open so the user sees the error
    } finally {
        setIsSubmitting(false); // Reset loading state regardless of outcome
    }
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
        <h2 className="text-xl font-semibold mb-4">
          {userName ? `Propose Meetup with ${userName}` : title}
        </h2>

        {/* --- Content Area Replaced with Form/Confirmation --- */}
        {showConfirmation ? (
            // Confirmation Dialog (from MeetupFormPopup)
            <div className="text-center">
                <p className="mb-4">Send this meetup proposal to {userName || 'this user'}?</p>
                <p><strong>Place:</strong> {placeName || `Custom @ ${selectedLocation?.lat.toFixed(4)}, ${selectedLocation?.lng.toFixed(4)}`}</p>
                <p><strong>Date:</strong> {meetupDateTime?.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {meetupDateTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> {/* Format time */}
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={handleConfirmSubmit}
                        className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-wait`}
                        disabled={isSubmitting} // Disable button while submitting
                    >
                        {isSubmitting ? 'Sending...' : 'Confirm & Send'}
                    </button>
                    <button
                        onClick={handleCancelSubmit}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                        disabled={isSubmitting} // Disable button while submitting
                    >
                        Cancel
                    </button>
                </div>
                {/* Display Submission Error */}
                {submitError && (
                    <p className="mt-4 text-sm text-red-600">{submitError}</p>
                )}
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
                      <MapMoveHandler onMoveEnd={fetchOverpassDataForBounds} />

                      {/* Custom Marker */}
                      {selectedLocation && selectedLocation.alt === undefined && (
                        <Marker position={selectedLocation}>
                          <Popup>Custom meeting point</Popup>
                        </Marker>
                      )}
                      {/* Overpass Markers (Dummy) */}
                      {!isLoadingOverpass && overpassPlaces.map(place => (
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
                {isLoadingOverpass && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
                        <p className="text-gray-600">Loading places...</p>
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
                  type="submit" // Trigger the form's onSubmit which calls handleSubmitAttempt
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" // Adjusted styling slightly
                >
                  Meet proposal
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default SimpleMessagePopup;