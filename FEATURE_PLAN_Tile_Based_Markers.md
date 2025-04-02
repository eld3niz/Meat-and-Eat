# Feature Plan: Tile-Based Markers for Privacy

**Goal:** Implement a 1km x 1km tiling system for markers when `mapZoom >= 14`, replacing the default `leaflet.markercluster` behavior at those zoom levels to enhance user privacy. Existing clustering behavior for `mapZoom < 14` should remain unchanged.

**Prerequisite:** Set `maxZoom={14}` on the main Leaflet MapContainer.

**Implementation Steps:**

1.  **Set Max Zoom (`WorldMap.tsx`):**
    *   Modify the `<MapContainer>` component props to include `maxZoom={14}`.
    *   Review and adjust any other zoom-related logic (e.g., `minDetailZoom`, `targetZoom` calculations in event handlers) for compatibility with the new max zoom.

2.  **Tiling Utility Functions (`src/utils/mapUtils.ts`):**
    *   Implement standard OSM tile calculation functions:
        *   `latLonToTileXY(lat: number, lon: number, zoom: number): {x: number, y: number}`
        *   `tileXYToLatLon(x: number, y: number, zoom: number): {lat: number, lon: number}` (for tile corner)
    *   Create `getTileId(lat: number, lon: number): string`:
        *   Uses `latLonToTileXY` with `zoom = 14`.
        *   Returns a unique string ID, e.g., `"14-x-y"`.
    *   Create `getTileCenterLatLng(tileId: string): L.LatLng`:
        *   Parses `tileId` to get x, y, zoom (14).
        *   Uses `tileXYToLatLon` to get coordinates of corners (e.g., top-left and bottom-right) and calculates the center point.

3.  **Data Aggregation Hook (`src/hooks/useMapTilingData.ts`):**
    *   Create a new custom hook: `useMapTilingData(cities: City[], users: MapUser[], currentUserId: string | null, isEnabled: boolean)`.
    *   If `!isEnabled` (i.e., `mapZoom < 14`), return an empty map or null.
    *   If `isEnabled`, iterate through `cities` and `users`.
    *   Use `getTileId` to determine the tile for each item.
    *   Group items into a `Map<string, { items: (City | MapUser)[], containsCurrentUser: boolean }>`.
    *   Update `containsCurrentUser` flag for the tile if a user matches `currentUserId`.
    *   Return the aggregated data map.

4.  **Tiled Markers Layer Component (`src/components/Map/TiledMarkersLayer.tsx`):**
    *   A React component using `useMap` hook.
    *   Receives `tileAggregationData`, `onSingleCityTileClick`, `onSingleUserTileClick`, `onAggregateTileClick`, `currentUserId` as props.
    *   Iterates through `tileAggregationData`.
    *   For each `tileId`, calculate `tileCenter` using `getTileCenterLatLng`.
    *   **Single Item Tile (`items.length === 1`):**
        *   Render a standard Leaflet `Marker` at `tileCenter`.
        *   Use appropriate icon (`createSvgMarkerIcon` for city, `currentUserIconRed`/`otherUserIconBlue` for user).
        *   Attach the corresponding click handler (`onSingleCityTileClick(item)` or `onSingleUserTileClick(item)`).
        *   Bind tooltip with item name.
    *   **Aggregate Tile (`items.length > 1`):**
        *   Render a Leaflet `Marker` at `tileCenter`.
        *   Use a custom `L.divIcon` displaying the count (`items.length`) in bold.
        *   Icon background: Red if `containsCurrentUser` is true, Blue otherwise.
        *   Attach `onAggregateTileClick(tileId, items, tileCenter)` handler.

5.  **Aggregate List Popup Component (`src/components/UI/TileListPopup.tsx`):**
    *   A simple React component.
    *   Receives `items: (City | MapUser)[]` and `onClose: () => void`.
    *   Displays a styled, scrollable list of item names/types.
    *   **No interaction** when clicking items in the list.
    *   Includes a close button/mechanism triggering `onClose`.

6.  **Basic User Info Popup (`src/components/Map/UserInfoPopup.tsx`):**
    *   Create a new component (or adapt existing `InfoPopup.tsx`).
    *   Receives `user: MapUser` and `onClose: () => void`.
    *   Displays basic user information (e.g., name "User Location" or actual name if available).
    *   Includes a close button/mechanism triggering `onClose`.

7.  **Integrate into `WorldMap.tsx`:**
    *   Import new hooks (`useMapTilingData`) and components (`TiledMarkersLayer`, `TileListPopup`, `UserInfoPopup`).
    *   Add state variables to hold references to the currently open Leaflet popup instances for aggregate lists and single users, allowing them to be closed programmatically if needed.
    *   Inside `<MapContainer>`, use conditional rendering based on `mapZoom`:
        ```tsx
        {mapZoom < 14 ? (
          <MarkerCluster /* ... existing props ... */ />
        ) : (
          <TiledMarkersLayer
             tileAggregationData={/* from useMapTilingData */}
             onSingleCityTileClick={handleSingleCityTileClick}
             onSingleUserTileClick={handleSingleUserTileClick}
             onAggregateTileClick={handleAggregateTileClick}
             currentUserId={user?.id ?? null}
          />
        )}
        ```
    *   Implement new event handlers:
        *   `handleSingleCityTileClick(city: City)`: Calls the existing `handleMarkerClick(city)` to show the standard city info popup.
        *   `handleSingleUserTileClick(user: MapUser, marker: L.Marker)`: Uses `marker.bindPopup(...).openPopup()` or `map.openPopup(...)` to show the `<UserInfoPopup>` component, rendering it within the Leaflet popup. Store the popup instance reference.
        *   `handleAggregateTileClick(tileId: string, items: (City | MapUser)[], tileCenter: L.LatLng, marker: L.Marker)`: Uses `marker.bindPopup(...).openPopup()` or `map.openPopup(...)` at `tileCenter` to show the `<TileListPopup>` component. Store the popup instance reference.
    *   Ensure logic exists to close previously opened popups (aggregate or user info) when a new one is opened or the map is clicked elsewhere.

8.  **Refinement & Testing:**
    *   Finalize the visual design of the aggregate marker `divIcon`.
    *   Thoroughly test the zoom transition between `<MarkerCluster>` and `<TiledMarkersLayer>`.
    *   Test rendering of single and aggregate tiles.
    *   Test click interactions for all marker types (cluster, single city, single user tile, aggregate tile).
    *   Verify popup displays and closing behavior.
    *   Assess performance, especially the aggregation step in `useMapTilingData`.

**Data Flow Diagram:**

```mermaid
graph TD
    subgraph WorldMap.tsx
        A[Hooks: useAuth, useMapData] --> S[Map State: mapZoom(max=14), cities, users, currentUserId];
        S -- mapZoom --> C{Zoom Level Check};
        C -- "< 14" --> D[MarkerCluster Component];
        C -- ">= 14" --> E[useMapTilingData Hook];
        E -- tileAggregationData --> F[TiledMarkersLayer Component];

        D -- Renders --> ClusterLayer[Leaflet MarkerCluster Layer];
        F -- Renders --> TiledLayer[Leaflet Layer with Tiled Markers];

        TiledLayer -- Single City Click --> H1[handleSingleCityTileClick];
        TiledLayer -- Single User Click --> H2[handleSingleUserTileClick];
        TiledLayer -- Aggregate Marker Click --> H3[handleAggregateTileClick];
        ClusterLayer -- Marker Click --> H4[handleMarkerClick (Existing)];
        ClusterLayer -- Cluster Click --> H5[handleClusterClick (Existing)];

        H1 -- Calls --> H4;
        H2 -- Opens --> P1[Leaflet Popup w/ UserInfoPopup];
        H3 -- Opens --> P2[Leaflet Popup w/ TileListPopup];

        subgraph mapUtils.ts
            Util1[latLonToTileXY]
            Util2[tileXYToLatLon]
            Util3[getTileId (zoom=14)]
            Util4[getTileCenterLatLng]
        end

        subgraph useMapTilingData.ts
            Input[cities, users, zoom >= 14] --> Aggregation{Group by tileId} --> Output[tileAggregationData];
            Aggregation -- uses --> Util3;
        end

         subgraph TiledMarkersLayer.tsx
            InputData[tileAggregationData] --> Logic{Render Markers based on items.length};
            Logic -- uses --> Util4;
            Logic --> TiledLayer;
         end

         subgraph TileListPopup.tsx
            InputItems[items] --> Display[Show List (No Interaction)]
         end
         subgraph UserInfoPopup.tsx
            InputUser[user] --> DisplayUser[Show User Info]
         end
    end