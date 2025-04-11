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

interface MeetupFormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void; // Define a more specific type later - will include cuisines now
  userId: string; // Added userId prop
}

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
            // Only allow placing a marker if no Overpass marker is selected (or implement different logic)
            // For now, clicking always sets a custom marker if no location is selected yet
            // or replaces the existing custom marker.
            if (!selectedLocation || selectedLocation.alt === undefined) { // Simple check if it's a custom marker
                 onMapClick(e.latlng);
            }
        },
    });
    return null;
};

// Component to handle map move events for fetching data (Copied from SimpleMessagePopup)
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


const MeetupFormPopup: React.FC<MeetupFormPopupProps> = ({ isOpen, onClose, onSubmit, userId }) => { // Added userId to destructuring
  const [placeName, setPlaceName] = useState('');
  const [meetupDateTime, setMeetupDateTime] = useState<Date | null>(new Date());
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null); // Stores LatLng of selected marker (custom or Overpass)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]); // State for selected cuisines
  const [userLocation, setUserLocation] = useState<LatLng | null>(null); // User's current location
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([51.505, -0.09]); // Default center
  const [overpassPlaces, setOverpassPlaces] = useState<OverpassPlace[]>([]); // Placeholder for fetched places
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingOverpass, setIsLoadingOverpass] = useState(false); // State for Overpass loading

  // Fetch user's location on mount
  useEffect(() => {
    if (isOpen) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng = new LatLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(userLatLng);
          setMapCenter(userLatLng);
          setIsLoadingLocation(false);
          // TODO: Fetch Overpass data based on initial location/bounds here
          // Fetch will be triggered by MapMoveHandler on initial load/center
          console.log("User location fetched:", userLatLng);
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Use default location if user denies permission or error occurs
          setUserLocation(new LatLng(51.505, -0.09)); // Fallback
          setMapCenter([51.505, -0.09]);
          setIsLoadingLocation(false);
          // TODO: Fetch Overpass data for default location?
          // Fetch will be triggered by MapMoveHandler on initial load/center
        },
        { enableHighAccuracy: true }
      );
    } else {
        // Reset state when closing
        setPlaceName('');
        setMeetupDateTime(new Date());
        setDescription('');
        setSelectedLocation(null);
        setSelectedCuisines([]); // Reset cuisines
        setUserLocation(null);
        setMapCenter([51.505, -0.09]);
        setOverpassPlaces([]);
        setIsLoadingLocation(true);
        setShowConfirmation(false);
    }
  }, [isOpen]);


  // TODO: Implement Overpass API fetching logic
  // Fetch Overpass data based on map bounds (Copied from SimpleMessagePopup)
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
              lat: element.center?.lat ?? element.lat,
              lon: element.center?.lon ?? element.lon,
              tags: element.tags || {},
          })).filter((place: OverpassPlace) => place.lat && place.lon); // Ensure coordinates exist

          console.log("Processed places:", places);
          setOverpassPlaces(places);

      } catch (error) {
          console.error("Failed to fetch Overpass data:", error);
      } finally {
          setIsLoadingOverpass(false);
      }
  };


  const handleMapClick = (latlng: LatLng) => {
    console.log("Custom marker placed at:", latlng);
    setSelectedLocation(latlng); // Set as custom marker
    setPlaceName(''); // Clear place name if user sets custom marker
  };

  const handleOverpassMarkerClick = (place: OverpassPlace) => {
    console.log("Overpass marker selected:", place);
    const location = new LatLng(place.lat, place.lon, place.id); // Use alt for ID or type differentiation
    setSelectedLocation(location);
    setPlaceName(place.tags.name || `Amenity ${place.id}`); // Set place name from marker
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !meetupDateTime) {
      alert('Please select a location on the map and set a date/time.');
      return;
    }
    if (!placeName && selectedLocation.alt === undefined) { // Check if it's a custom marker needing a name
        alert('Please provide a name for the custom location.');
        return;
    }
    setShowConfirmation(true); // Show confirmation dialog
  };

  const handleConfirmSubmit = () => {
     if (!selectedLocation || !meetupDateTime) return; // Should not happen due to previous check

    // Ensure placeName has a value (form validation should handle this, but add fallback)
    const meetupTitle = placeName || `Meetup @ ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;

    const formData = {
      title: meetupTitle, // Use the 'title' column name from the DB schema
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      meetup_time: meetupDateTime.toISOString(),
      description: description,
      cuisines: selectedCuisines, // Add selected cuisines
      // place_name removed as it's not in the DB schema
    };
    onSubmit(formData);
    setShowConfirmation(false); // Close confirmation
    // onClose(); // Close handled in MeetupsTab after submission simulation
  };

  const handleCancelSubmit = () => {
      setShowConfirmation(false);
  }

  // Handle clicking outside the popup
  const popupRef = useRef<HTMLDivElement>(null);
  
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handler for TagInput changes, enforcing max 3 selections
  const handleCuisineChange = (newSelection: string[]) => {
      if (newSelection.length <= 3) {
          setSelectedCuisines(newSelection);
      } else {
          // Optionally provide feedback to the user that the limit is reached
          console.warn("Maximum of 3 cuisines allowed.");
          // Or simply don't update the state if limit is exceeded
      }
  };

if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={handleOutsideClick}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative overscroll-contain" ref={popupRef}>
        {/* X button in top right corner */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Add New Meeting</h2>

        {showConfirmation ? (
            // Confirmation Dialog
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
            // Form
            <form onSubmit={handleSubmitAttempt}>
              {/* Map comes first now */}
              <div className="mb-12"> {/* Increased bottom margin for better separation */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isLoadingLocation ? (
                   <div className="h-full flex justify-center items-center bg-gray-100 text-gray-500">Loading map and location...</div>
                ) : (
                  <div className="h-64 md:h-80 relative"> {/* Added relative positioning container */}
                    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                      {/* ...existing map code... */}
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {userLocation && <CenterMapOnUser position={userLocation} />}
                      <MapClickHandler onMapClick={handleMapClick} selectedLocation={selectedLocation} />

                      <MapMoveHandler onMoveEnd={fetchOverpassDataForBounds} />
                      {/* Display markers... */}
                      {selectedLocation && selectedLocation.alt === undefined && (
                        <Marker position={selectedLocation}>
                          <Popup>Custom meeting point</Popup>
                        </Marker>
                      )}

                      {/* Conditionally render Overpass markers */}
                      {!isLoadingOverpass && overpassPlaces.map(place => ( <Marker
                            key={place.id}
                            position={[place.lat, place.lon]}
                            eventHandlers={{
                                click: () => handleOverpassMarkerClick(place),
                            }}
                        >
                            <Popup>
                                <b>{place.tags.name || 'Unnamed Place'}</b><br />
                                {place.tags.amenity || ''} {place.tags.cuisine ? `(${place.tags.cuisine})` : ''}<br/>
                                <button className="text-blue-500 underline text-sm" onClick={(e) => {e.stopPropagation(); handleOverpassMarkerClick(place);}}>Select this place</button>
                            </Popup>
                        </Marker>
                      ))}
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

              {/* Place Name after map with increased spacing */}
              <div className="mb-6"> {/* Normal spacing between form fields */}
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
                  // maxSelection={3} // Assuming TagInput doesn't have this, handled in handleCuisineChange
                />
                {selectedCuisines.length >= 3 && (
                   <p className="text-xs text-red-500 mt-1">Maximum of 3 cuisines selected.</p>
                )}
              </div>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reverted padding */}
                <div className="relative md:col-span-2"> {/* Reverted margin */}
                    <label htmlFor="meetupDate" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    {/* Styling for date picker z-index can be handled via popperClassName and CSS if needed */}
                    <DatePicker
                      id="meetupDate"
                      selected={meetupDateTime}
                      onChange={(date: Date | null) => setMeetupDateTime(date)}
                      showTimeSelect
                      dateFormat="Pp"
                      minDate={new Date()}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      popperClassName="date-picker-popper z-[1000]" // Add Tailwind z-index class directly if needed
                      popperPlacement="bottom-start" // Set popper placement
                    />
                </div>
              </div>

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

export default MeetupFormPopup;