# Feature Plan: Add Mock User Markers

**Objective:** Add 15 mock user markers centered around Hanoi, Vietnam, using the existing tile-based marker logic.

**Analysis:**

*   **City Data:** Hardcoded in `src/data/cities.ts`.
*   **User Data:** Fetched from Supabase (`get_snapped_map_users`) within `src/hooks/useMapData.ts`.
*   **Tiling:** The `useMapTilingData.ts` hook receives separate `cities` and `users` arrays, combines them, and calculates tile IDs using `getTileId` for all items with coordinates.
*   **Injection Point:** The best place to add mock users is within `src/hooks/useMapData.ts`, merging them with the fetched Supabase data before it's passed to the tiling hook.

**Implementation Plan:**

1.  **Create Mock User Data File (`src/data/mockUsers.ts`):**
    *   Define an exportable constant array named `mockUsers`.
    *   The array will contain 15 objects adhering to the `MapUser` interface (`user_id`, `name`, `latitude`, `longitude`).
    *   Assign unique `user_id` values (e.g., `mockuser_1`, `mockuser_2`, ...).
    *   Assign generic names ("Mock User 1", "Mock User 2", ...).
    *   Generate `latitude` and `longitude` coordinates centered around Hanoi, Vietnam (approx. 21.0285° N, 105.8542° E) with a small random offset (+/- 0.01 degrees).

2.  **Modify Data Loading in `src/hooks/useMapData.ts`:**
    *   Import the `mockUsers` array from `src/data/mockUsers.ts`.
    *   Locate the `fetchOtherUserLocations` function or the `useEffect` hook where `setAllOtherUsers` is called with the data from Supabase (around line 160).
    *   Modify the logic to concatenate the imported `mockUsers` array with the fetched user data *before* calling `setAllOtherUsers`.
    *   Example (conceptual):
        ```typescript
        // Inside fetchOtherUserLocations or useEffect after getting 'data' from Supabase
        import { mockUsers } from '../data/mockUsers'; // Import mock users

        // ... existing code ...

        if (data) {
          const fetchedUsers = currentUserId
            ? data.filter((loc: MapUser) => loc.user_id !== currentUserId)
            : data;
          const combinedUsers = [...fetchedUsers, ...mockUsers]; // Combine fetched and mock users
          setAllOtherUsers(combinedUsers); // Set the combined list
        } else {
          setAllOtherUsers([...mockUsers]); // Set only mock users if fetch fails or returns no data
        }
        ```

3.  **Verification:**
    *   Confirm that `useMapTilingData.ts` requires no changes, as it's designed to process the combined list of items passed via the `users` prop.
    *   Run the application and verify that 15 new user markers appear clustered around Hanoi, behaving correctly with the tiling and clustering logic.

**Diagram:**

```mermaid
graph TD
    A[Start: Add Mock Users] --> B(1. Create src/data/mockUsers.ts);
    B -- Defines --> C[15 MapUser objects near Hanoi];
    C -- Contains --> D[Unique IDs, Names, Random Lat/Lon];
    D --> E(2. Modify src/hooks/useMapData.ts);
    E --> F[Import mockUsers array];
    F --> G[Locate setAllOtherUsers call];
    G --> H[Concatenate mockUsers with fetched Supabase users];
    H --> I[Update allOtherUsers state with combined list];
    I --> J(3. Verify useMapTilingData.ts);
    J -- Confirms --> K[No changes needed, processes combined data];
    K --> L[End: Plan Ready];

    style B fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px