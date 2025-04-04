# Feature Plan: Map Popup Enhancements

**Goal:** Enhance the map's user popups (both single-user and aggregate tile popups) with a more engaging design, dynamic content based on filters, and additional user details (age, local status).

**Plan:**

1.  **Verify Data Availability (`useMapData.ts`):**
    *   Examine `src/hooks/useMapData.ts`.
    *   Confirm that the `MapUser` type definition includes fields for `age` and `local_status` (or similar).
    *   Verify that the data fetching logic retrieves these fields and includes them in the `filteredUsers` array.
    *   *(Contingency)*: If missing, modify the hook to fetch and include them.

2.  **Update Single User Popup (`UserInfoPopup.tsx`):**
    *   Modify `src/components/Map/UserInfoPopup.tsx`.
    *   Add elements to display `age` and `local_status`.
    *   Update Tailwind CSS for a larger, more engaging design.

3.  **Update Aggregate Tile Popup (`TileListPopup.tsx`):**
    *   Examine `src/components/UI/TileListPopup.tsx`.
    *   Modify it to display `name`, `age`, and `local_status` for each user.
    *   Update Tailwind CSS for design consistency.

4.  **Review & Refine:**
    *   Ensure popups correctly reflect filters and display the new data.
    *   Confirm design goals are met.

**Diagram (Simplified Flow):**

```mermaid
graph LR
    A[Sidebar Filters] --> B(useMapData Hook);
    C[Backend Data (Users + Cities)] --> B;
    B -- filteredUsers, filteredCities --> D(WorldMap Component);
    D -- tileAggregationData --> E{useMapTilingData Hook};
    E -- tileData --> D;
    D -- markersForClustering --> F(MarkerCluster Component);
    D -- tileAggregationData --> G(TileAggregateLayer Component);

    subgraph Popups
        H(UserInfoPopup)
        I(TileListPopup)
    end

    F -- onItemClick (User) --> D -- Renders --> H;
    G -- onAggregateClick --> D -- Renders --> I;

    style H fill:#f9f,stroke:#333,stroke-width:2px;
    style I fill:#f9f,stroke:#333,stroke-width:2px;
    style B fill:#ccf,stroke:#333,stroke-width:2px;