import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  onSubmit: (formData: any) => void; // Define a more specific type later
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


const MeetupFormPopup: React.FC<MeetupFormPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [placeName, setPlaceName] = useState('');
  const [meetupDateTime, setMeetupDateTime] = useState<Date | null>(new Date());
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null); // Stores LatLng of selected marker (custom or Overpass)
  const [userLocation, setUserLocation] = useState<LatLng | null>(null); // User's current location
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([51.505, -0.09]); // Default center
  const [overpassPlaces, setOverpassPlaces] = useState<OverpassPlace[]>([]); // Placeholder for fetched places
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
          console.log("User location fetched:", userLatLng);
          fetchOverpassData(userLatLng); // Call function to fetch data
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Use default location if user denies permission or error occurs
          const fallbackLoc = new LatLng(51.505, -0.09);
          setUserLocation(fallbackLoc); // Fallback
          setMapCenter([51.505, -0.09]);
          setIsLoadingLocation(false);
          fetchOverpassData(fallbackLoc); // Fetch for default location
        },
        { enableHighAccuracy: true }
      );
    } else {
        // Reset state when closing
        setPlaceName('');
        setMeetupDateTime(new Date());
        setDescription('');
        setSelectedLocation(null);
        setUserLocation(null);
        setMapCenter([51.505, -0.09]);
        setOverpassPlaces([]);
        setIsLoadingLocation(true);
        setShowConfirmation(false);
    }
  }, [isOpen]);


  // TODO: Implement Overpass API fetching logic
  const fetchOverpassData = async (center: LatLng | LatLngExpression) => { // Accept LatLngExpression too
      console.log("Fetching Overpass data around:", center);

      // Determine lat/lng safely for dummy data generation
      let lat: number, lng: number;
      // Check for LatLng object first (most specific)
      if (center instanceof L.LatLng) {
          lat = center.lat;
          lng = center.lng;
      }
      // Check for LatLngTuple (array)
      else if (Array.isArray(center) && center.length === 2 && typeof center[0] === 'number' && typeof center[1] === 'number') {
          lat = center[0];
          lng = center[1];
      }
      // Check for LatLngLiteral (plain object) - requires careful check
      else if (typeof center === 'object' && center !== null && 'lat' in center && 'lng' in center && typeof (center as any).lat === 'number' && typeof (center as any).lng === 'number') {
          // Cast needed here after checks
          const literalCenter = center as L.LatLngLiteral;
          lat = literalCenter.lat;
          lng = literalCenter.lng;
      }
       else {
          console.error("Could not determine center coordinates for Overpass fetch.");
          // Use default if failed
          lat = 51.505;
          lng = -0.09;
      }


      // Placeholder: Replace with actual Overpass query and fetch
      // Example query: node(around:1000, lat, lon)[amenity=restaurant]; out;
      // Use map bounds for a better query: node(bbox)[amenity=restaurant]; out;
      // const bounds = mapRef.current?.getBounds(); // Need map ref
      // if (!bounds) return;
      // const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      // ... fetch logic ...
      // setOverpassPlaces(fetchedData);
      setOverpassPlaces([ // Dummy data using safely extracted lat/lng
          { id: 1, lat: lat + 0.01, lon: lng, tags: { name: 'Dummy Restaurant', amenity: 'restaurant' } },
          { id: 2, lat: lat, lon: lng + 0.01, tags: { name: 'Dummy Cafe', amenity: 'cafe' } },
      ]);
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
    // Check if placeName is required (i.e., custom marker is selected) and empty
    if (selectedLocation.alt === undefined && !placeName) {
        alert('Please provide a name for the custom location.');
        return;
    }
    setShowConfirmation(true); // Show confirmation dialog
  };

  const handleConfirmSubmit = () => {
     if (!selectedLocation || !meetupDateTime) return; // Should not happen due to previous check

    const formData = {
      place_name: placeName || `Custom Location @ ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`, // Default name for custom marker if empty
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      meetup_datetime: meetupDateTime.toISOString(),
      description: description,
    };
    onSubmit(formData);
    setShowConfirmation(false); // Close confirmation
    // onClose(); // Close handled in MeetupsTab after submission simulation
  };

  const handleCancelSubmit = () => {
      setShowConfirmation(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

              {/* Map Section First */}
              <div className="mb-4 h-64 md:h-80"> {/* Map container with fixed height */}
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isLoadingLocation ? (
                   <div className="h-full flex justify-center items-center bg-gray-100 text-gray-500">Loading map and location...</div>
                ) : (
                  // Add relative positioning and z-index to map container if needed, although datepicker fix might be enough
                  <div className="relative h-full">
                      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {userLocation && <CenterMapOnUser position={userLocation} />}
                        <MapClickHandler onMapClick={handleMapClick} selectedLocation={selectedLocation} />

                        {/* Display selected custom marker */}
                        {selectedLocation && selectedLocation.alt === undefined && (
                          <Marker position={selectedLocation}>
                            <Popup>Custom meeting point</Popup>
                          </Marker>
                        )}

                         {/* Display Overpass markers (dummy data for now) */}
                        {overpassPlaces.map(place => (
                            <Marker
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
                         {/* Display selected Overpass marker distinctly */}
                         {selectedLocation && selectedLocation.alt !== undefined && (
                            <Marker position={selectedLocation} /* icon={selectedIcon} */ >
                                <Popup>Selected: {placeName}</Popup>
                            </Marker>
                         )}

                      </MapContainer>
                  </div>
                )}
                 <p className="text-xs text-gray-500 mt-1">Click on map to set custom marker or click an existing marker.</p>
              </div>

               {/* Place Name Second */}
               <div className="mb-4">
                <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                <input
                  type="text"
                  id="placeName"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  // Required if a custom marker is placed (selectedLocation exists and has no 'alt' property)
                  required={!!selectedLocation && selectedLocation.alt === undefined}
                  // Disable if an Overpass marker is selected (selectedLocation exists and has an 'alt' property)
                  disabled={!!selectedLocation && selectedLocation.alt !== undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                  placeholder={selectedLocation?.alt !== undefined ? "Selected from map" : "Enter name if placing custom marker"}
                />
                 {selectedLocation?.alt !== undefined && <p className="text-xs text-gray-500 mt-1">Name is set from the selected map marker.</p>}
                 {selectedLocation?.alt === undefined && selectedLocation && <p className="text-xs text-gray-500 mt-1">Required: Name this custom location.</p>}
                 {!selectedLocation && <p className="text-xs text-gray-500 mt-1">Select a location on the map first.</p>}
              </div>

              {/* Date/Time Picker Section - Add margin-top and wrap for z-index */}
              <div className="mt-6 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Increased top margin */}
                <div className="relative z-10"> {/* Add relative and z-index here */}
                    <label htmlFor="meetupDate" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <DatePicker
                      id="meetupDate"
                      popperClassName="react-datepicker-high-z" // Add custom class for higher z-index targeting
                      selected={meetupDateTime}
                      onChange={(date: Date | null) => setMeetupDateTime(date)}
                      showTimeSelect
                      dateFormat="Pp" // Format like "MM/dd/yyyy, h:mm aa"
                      minDate={new Date()} // Prevent selecting past dates
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                {/* Empty div for spacing if needed, or adjust grid cols */}
              </div>

              {/* Description Section */}
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

export default MeetupFormPopup;