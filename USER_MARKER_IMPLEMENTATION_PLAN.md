# Plan: Display Other Users' Locations on Map

**Goal:** Enhance the map page to display markers for all users registered in the Supabase `user_locations` table, in addition to existing city markers and the current user's location marker. These new user markers should be green.

**Prerequisites:**

*   Supabase project with `profiles` and `user_locations` tables set up as per `supabase_sql_queries.md`.
*   Existing React application structure with Leaflet map integration (`src/components/Map/WorldMap.tsx`, `src/hooks/useMapData.ts`, etc.).
*   Supabase client library integrated for data fetching.

**Database/RLS Changes:**

*   **None required.** The existing Row Level Security policy `"Allow authenticated users to view locations"` on `public.user_locations` permits fetching all locations for logged-in users.

**Implementation Steps:**

1.  **Modify Data Hook (`src/hooks/useMapData.ts`):**
    *   **Add State:** Introduce new state variables to manage the fetching and storage of other users' locations.
        ```typescript
        const [otherUserLocations, setOtherUserLocations] = useState<UserLocation[]>([]); // Define UserLocation type based on table
        const [loadingOtherUsers, setLoadingOtherUsers] = useState<boolean>(true);
        const [errorOtherUsers, setErrorOtherUsers] = useState<string | null>(null);
        ```
    *   **Fetch Function:** Create an asynchronous function to fetch data from `public.user_locations` using the Supabase client.
        ```typescript
        const fetchOtherUserLocations = async () => {
          setLoadingOtherUsers(true);
          setErrorOtherUsers(null);
          try {
            // Assuming 'supabase' client is available in scope
            const { data, error } = await supabase
              .from('user_locations')
              .select('user_id, latitude, longitude'); // Select necessary fields

            if (error) throw error;
            if (data) {
              // Filter out the current user's location if desired, or handle duplicates
              // const currentUserId = supabase.auth.user()?.id;
              // setOtherUserLocations(data.filter(loc => loc.user_id !== currentUserId));
              setOtherUserLocations(data); // Or simply set all fetched locations
            }
          } catch (err: any) {
            console.error("Error fetching other user locations:", err);
            setErrorOtherUsers("Failed to load other user locations.");
          } finally {
            setLoadingOtherUsers(false);
          }
        };
        ```
    *   **Call Fetch Function:** Invoke `fetchOtherUserLocations` within the main `useEffect` hook where city data is currently loaded (or simulated).
        ```typescript
        useEffect(() => {
          const loadData = async () => {
            // ... existing city loading logic ...
            await fetchOtherUserLocations(); // Fetch user locations
            setLoading(false); // Set overall loading false after all data is attempted
          };
          loadData();
        }, []); // Dependency array might need adjustment if Supabase client depends on auth state
        ```
    *   **Return Values:** Add the new state variables (`otherUserLocations`, `loadingOtherUsers`, `errorOtherUsers`) to the object returned by the `useMapData` hook.

2.  **Create Green Marker Icon (`src/components/Map/OtherUserIcon.ts` or similar):**
    *   Define a custom Leaflet icon using `L.icon`. Use a green marker image (either local or external URL) or style a `DivIcon`.
    ```typescript
    import L from 'leaflet';

    export const otherUserIcon = L.icon({
        iconUrl: '/path/to/green-marker.png', // Replace with actual path or URL
        iconSize: [25, 41], // Standard Leaflet marker size
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: '/path/to/marker-shadow.png', // Optional shadow
        shadowSize: [41, 41]
    });

    // Alternatively, use a DivIcon for CSS styling
    // export const otherUserIcon = L.divIcon({
    //     className: 'custom-green-marker', // Add CSS for this class
    //     html: '<div></div>', // Or some inner HTML
    //     iconSize: [20, 20],
    //     iconAnchor: [10, 10]
    // });
    ```

3.  **Create Other User Marker Component (`src/components/Map/OtherUserMarker.tsx`):**
    *   Create a simple React component that uses Leaflet's `Marker` component.
    *   Accept `latitude` and `longitude` as props.
    *   Use the custom green icon created in the previous step.
    *   Optionally add a basic popup or event handlers if needed later.
    ```typescript
    import React from 'react';
    import { Marker, Popup } from 'react-leaflet';
    import { otherUserIcon } from './OtherUserIcon'; // Import the custom icon

    interface OtherUserMarkerProps {
      latitude: number;
      longitude: number;
      userId?: string; // Optional: If needed for popups later
    }

    const OtherUserMarker: React.FC<OtherUserMarkerProps> = ({ latitude, longitude, userId }) => {
      if (latitude === null || longitude === null) return null; // Basic validation

      return (
        <Marker position={[latitude, longitude]} icon={otherUserIcon}>
          {/* Optional: Basic Popup */}
          {/* <Popup>
            User Location <br /> Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
          </Popup> */}
        </Marker>
      );
    };

    export default OtherUserMarker;
    ```

4.  **Modify Map Component (`src/components/Map/WorldMap.tsx`):**
    *   **Import:** Import the `OtherUserMarker` component.
    *   **Retrieve Data:** Get `otherUserLocations`, `loadingOtherUsers`, and `errorOtherUsers` from the `useMapData` hook.
        ```typescript
        const { /* ... other properties ... */, otherUserLocations, loadingOtherUsers, errorOtherUsers } = useMapData();
        ```
    *   **Handle Loading/Error:** Add checks for `loadingOtherUsers` and `errorOtherUsers` alongside the existing `mapDataLoading` and `mapDataError` checks, potentially displaying a combined loading state or specific error messages.
    *   **Render Markers:** Inside the `<MapContainer>`, map over the `otherUserLocations` array and render an `<OtherUserMarker />` for each location. Place this mapping logically relative to other layers (e.g., after `TileLayer` but potentially before or after `MarkerCluster` depending on desired layering).
        ```typescript
        <MapContainer /* ...props... */ >
          {/* ... TileLayer, Controls, etc. ... */}

          {/* Render City Markers (existing) */}
          <MarkerCluster /* ...props... */ />

          {/* Render Other User Markers */}
          {!loadingOtherUsers &amp;&amp; otherUserLocations.map((location, index) => (
            <OtherUserMarker
              key={location.user_id || index} // Use user_id if unique and available, else index
              latitude={location.latitude}
              longitude={location.longitude}
              // userId={location.user_id} // Pass if needed
            />
          ))}

          {/* ... UserLocationMarker, RadiusCircle, Popups etc. ... */}
        </MapContainer>
        ```
    *   **Clustering (Optional):** If clustering is desired for user markers, investigate integrating them into the existing `MarkerCluster` component or using a separate `MarkerClusterGroup` for them. This might require modifications to the `MarkerCluster` component itself.

**Future Enhancements (Out of Scope for Initial Implementation):**

*   Display user information (e.g., name from `profiles` table) in popups for green markers. This might require fetching profile data alongside location data, potentially needing Supabase Functions or adjusted RLS policies for performance and security.
*   Implement clustering for green markers if performance becomes an issue with many users.
*   Add filtering options specifically for user markers.