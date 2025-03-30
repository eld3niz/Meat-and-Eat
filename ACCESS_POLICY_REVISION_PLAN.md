# Website Access & Location Policy Revision Plan

**Goals:**

1.  Restrict map visibility to logged-in users only.
2.  Require logged-in users to grant browser location permission to use the map/core service.
3.  Display a persistent, polite modal requesting location permission if it's denied or unavailable for a logged-in user.
4.  Remove the manual location activation control from the filter bar UI.

**Implementation Steps:**

1.  **Authentication Gate for Map Component:**
    *   **Identify:** Locate the primary component responsible for rendering the map view (likely within `src/components/Map/` or potentially integrated into a page component in `src/components/Pages/`). Let's assume it's `MapContainer.tsx` for planning purposes.
    *   **Modify:** In the component that routes to or renders `MapContainer.tsx`, use the `useAuth` hook.
    *   **Logic:** Before rendering `MapContainer.tsx`, check `if (!user)`. If true, either redirect the user to a dedicated login/signup page or render a placeholder component prompting them to log in/sign up instead of the map. The main homepage route should remain accessible.

2.  **Mandatory Location Permission Logic:**
    *   **Enhance `AuthContext` (`src/context/AuthContext.tsx`):**
        *   **Add State:** Introduce a new state variable to track the explicit status of location permission:
            ```typescript
            const [locationPermissionStatus, setLocationPermissionStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
            ```
        *   **Modify `handleLocationPermission`:**
            *   On successful retrieval (`getCurrentPosition` success callback): Set `locationPermissionStatus` to `'granted'`. Continue calling `updateUserLocation` as before.
            *   On error/denial (`getCurrentPosition` error callback):
                *   Check `error.code`: If `PERMISSION_DENIED` (code 1), set `locationPermissionStatus` to `'denied'`.
                *   If `POSITION_UNAVAILABLE` (code 2) or `TIMEOUT` (code 3), set `locationPermissionStatus` to `'unavailable'`.
                *   Continue updating the `location_access: false` in the `profiles` table for record-keeping.
            *   If `!navigator.geolocation`: Set `locationPermissionStatus` to `'unavailable'`.
        *   **Expose State:** Add `locationPermissionStatus` to the context value provided by `AuthProvider`.
    *   **Create Persistent Modal (`src/components/UI/LocationPermissionModal.tsx`):**
        *   **Content:** Design a modal explaining clearly and politely *why* location access is essential for the service (mentioning seeing others and contributing). Include a button like "Grant Location Access".
        *   **Functionality:** The button should re-trigger the `handleLocationPermission` function from the `AuthContext`. Note: If a user has *permanently* denied permission in their browser settings, the prompt won't reappear directly. The modal might need additional text guiding users to check their browser settings in such cases.
    *   **Global Modal Rendering (e.g., in `src/App.tsx` or Layout Component):**
        *   Use the `useAuth` hook to get `user` and `locationPermissionStatus`.
        *   Conditionally render `<LocationPermissionModal />` if `user` is logged in AND `locationPermissionStatus` is `'denied'` or `'unavailable'`. This ensures it overlays other content when needed.

3.  **Conditional Map Rendering:**
    *   **Modify `MapContainer.tsx` (or equivalent):**
        *   Use the `useAuth` hook to get `user` and `locationPermissionStatus`.
        *   Render the actual map components *only* if `user` exists AND `locationPermissionStatus === 'granted'`.
        *   If the user is logged in but permission isn't granted, the globally rendered `LocationPermissionModal` will be visible, effectively blocking interaction with the map area.

4.  **UI Cleanup (Filter Bar):**
    *   **Identify:** Locate the component rendering the filter controls (e.g., `src/components/Controls/FilterBar.tsx`).
    *   **Modify:** Remove the specific button/toggle/checkbox related to manual location activation. Ensure the radius slider and other elements remain functional.

**Database Impact:**

*   The `profiles.location_access` field remains useful for storing the last known status but isn't the primary driver for the *live* UI blocking (which now relies on the `locationPermissionStatus` state in `AuthContext`).
*   The `user_locations` table usage (upserting coordinates) remains unchanged and correct.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    subgraph User Flow
        A[User Visits Site] --> B{User Logged In?};
        B -- No --> C[Show Homepage/Public Pages];
        C --> D[Login/Signup Option];
        B -- Yes --> E{Check Location Permission Status (AuthContext)};

        E -- Status: Granted --> F[Render Map & Core Features];
        F --> G[Allow Interaction (Filters - Radius, etc.)];

        E -- Status: Denied / Unavailable --> H[Render Persistent 'Grant Location' Modal (Global)];
        H --> I[Map Component Renders Nothing / Placeholder];
        I --> J{User Clicks 'Grant Location' in Modal};
        J --> K[Re-trigger handleLocationPermission];
        K --> E;

        E -- Status: Pending --> L[Show Loading State / Wait];
    end

    subgraph Implementation Components
        M[AuthContext] --> N[Manages Auth State (user)];
        M --> O[Manages locationPermissionStatus State];
        M --> P[Provides handleLocationPermission Function];

        Q[Map Component] --> R{Checks user & locationPermissionStatus};
        R -- Granted --> S[Renders Map];
        R -- Else --> T[Renders Nothing / Placeholder];

        U[Global Layout/App.tsx] --> V{Checks user & locationPermissionStatus};
        V -- Logged In & (Denied/Unavailable) --> W[Renders LocationPermissionModal];

        X[LocationPermissionModal] --> Y[Explains Need & Button to Grant];
        Y --> Z[Calls handleLocationPermission];

        AA[FilterBar Component] --> BB[Remove Manual Location Toggle];
    end

    style H fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#f9f,stroke:#333,stroke-width:2px