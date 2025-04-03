# Feature Plan: Always-Tiled Markers with Clustering

**Objective:** Modify the map marker display logic to always place markers (cities and users) at the center of their corresponding map tile, regardless of zoom level. This enhances user privacy by abstracting precise locations while retaining clustering functionality for tiles with multiple items.

**Current State:**
*   `useMapTilingData.ts`: Calculates tile aggregation data, but only when enabled (currently zoom >= 14).
*   `WorldMap.tsx`: Conditionally renders either `MarkerCluster` (using real coordinates, zoom < 14) or `TiledMarkersLayer` (using tile centers, zoom >= 14).
*   `TiledMarkersLayer.tsx`: Renders markers based on tile data, always using tile centers.
*   `MarkerCluster.tsx`: Takes separate city/user lists, clusters them based on *real* coordinates, and handles custom cluster icons.

**Proposed Plan:**

1.  **Modify Data Aggregation Hook (`src/hooks/useMapTilingData.ts`):**
    *   **Goal:** Always calculate tile data, regardless of zoom.
    *   **Action:** Remove the `isEnabled` parameter and its associated conditional logic. The hook will now always return the `Map<string, TileData>`.

2.  **Modify Map Orchestration Component (`src/components/Map/WorldMap.tsx`):**
    *   **Goal:** Prepare a single list of markers positioned at tile centers for the clustering component.
    *   **Actions:**
        *   **Update Hook Call:** Remove the `mapZoom >= 14` condition when calling `useMapTilingData`.
        *   **Create Transformation Logic:** Implement a `useMemo` hook that:
            *   Takes the `tileAggregationData` from `useMapTilingData`.
            *   Iterates through each `tileId` and its corresponding `tileData`.
            *   Calculates the `tileCenter` using `getTileCenterLatLng(tileId)`.
            *   For each `item` (City or MapUser) within `tileData.items`, create a "marker definition" object:
                ```typescript
                interface MarkerDefinition {
                  id: string; // e.g., 'city-123' or 'user-abc'
                  latitude: number; // tileCenter.lat
                  longitude: number; // tileCenter.lng
                  type: 'city' | 'user';
                  name: string;
                  userId?: string | null; // For user type
                  population?: number; // For city type
                  originalItem: City | MapUser; // Crucial for click handlers
                }
                ```
            *   Returns a single, flat array of these marker definition objects (`markersForClustering`).
        *   **Remove Conditional Rendering:** Delete the `mapZoom < 14 ? (...) : (...)` block.
        *   **Remove `TiledMarkersLayer`:** Delete the import and usage of `TiledMarkersLayer`.
        *   **Render `MarkerCluster`:** Render `<MarkerCluster>` unconditionally. Pass `markersForClustering` to a new prop (e.g., `markersData`). Pass necessary click handlers (e.g., `handleSingleCityTileClick`, `handleSingleUserTileClick`).

3.  **Adapt Clustering Component (`src/components/Map/MarkerCluster.tsx`):**
    *   **Goal:** Consume the pre-processed marker list and handle clicks correctly.
    *   **Actions:**
        *   **Update Props:** Remove `cities`/`users`, add `markersData: Array<MarkerDefinition>`. Adjust click handler props as needed.
        *   **Update Marker Creation Logic:**
            *   Iterate over `markersData`.
            *   Use `markerDef.latitude`, `markerDef.longitude` (tile centers) for `L.marker` position.
            *   Use `markerDef.type`, `markerDef.population`, `markerDef.userId` to select the correct icon.
            *   Attach `userId` for cluster styling: `(marker as any).userId = markerDef.userId;`.
            *   Attach click listeners: Inside the listener, use `markerDef.originalItem` and `markerDef.type` to call the appropriate handler from `WorldMap.tsx`.
            *   Set tooltip using `markerDef.name`.
        *   **Cluster Icon Logic (`iconCreateFunction`):** Should work as is, relying on the attached `userId`.

**Conceptual Flow Diagram:**

```mermaid
graph TD
    A[Raw Data: Cities, Users] --> B(useMapData Hook);
    B --> C{WorldMap.tsx};
    C --> D[useMapTilingData Hook (Always On)];
    D -- Tile Aggregation Map --> E{useMemo: Transform Data};
    E -- Flat Array: markersForClustering --> F[MarkerCluster Component];
    F -- Renders Clustered Markers @ Tile Centers --> G(Leaflet Map);
    F -- Click Events (with originalItem) --> C;
    C -- Popup Logic --> G;

    subgraph WorldMap.tsx
        C
        E
    end

    subgraph MarkerCluster.tsx
        F
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:1px
    style E fill:#ccf,stroke:#333,stroke-width:1px
```

**Next Steps:** Implement the changes described above in Code mode.