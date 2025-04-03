# Feature Plan: Distance Slider Loading Indicator

**Goal:** Replace the greyed-out distance slider in the map sidebar with a loading animation and text while fetching the user's location.

**Analysis:**

1.  The `RadiusSlider` component (`src/components/Controls/RadiusSlider.tsx`) is simple and doesn't handle disabling logic.
2.  The `Sidebar` component (`src/components/UI/Sidebar.tsx`) currently disables the slider based on whether `userPosition` (received as a prop) is available.
3.  The `WorldMap` component (`src/components/Map/WorldMap.tsx`) gets the user's location (`userCoordinates`) and an initial loading state (`authLoading`) from the `useAuth` hook (`src/context/AuthContext.tsx`).
4.  The `AuthContext`'s current `loading` state (`authLoading`) tracks the initial authentication/session loading, not specifically the *geolocation fetching* process (`navigator.geolocation.getCurrentPosition`). Geolocation fetching happens asynchronously after initial load and permission checks.

**Proposed Implementation:**

1.  **Enhance `AuthContext.tsx`:**
    *   Introduce a new state variable: `isFetchingLocation: boolean`, initialized to `false`.
    *   Update the `AuthContextType` interface to include `isFetchingLocation`.
    *   Modify the `fetchCoordinates` function:
        *   Set `isFetchingLocation` to `true` immediately before calling `navigator.geolocation.getCurrentPosition`.
        *   Set `isFetchingLocation` back to `false` in both the success and error callbacks of `getCurrentPosition`.
        *   Set `isFetchingLocation` back to `false` if geolocation is not supported.
    *   Expose `isFetchingLocation` in the context's value provided by `AuthProvider`.

2.  **Update `WorldMap.tsx`:**
    *   Destructure the new `isFetchingLocation` state from the `useAuth()` hook.
    *   Pass this state down to the `Sidebar` component as a new prop: `isLocationLoading={isFetchingLocation}`.

3.  **Modify `Sidebar.tsx`:**
    *   Add `isLocationLoading: boolean;` to the `SidebarProps` interface.
    *   Destructure the `isLocationLoading` prop.
    *   Locate the distance filter section (around line 128).
    *   Wrap the current slider `div` (lines 141-154) in conditional rendering:
        *   **If `isLocationLoading` is `true`:** Render a container `div` with a loading spinner (e.g., using Tailwind CSS `animate-spin`) and a `span` containing the text "Finding location...". Ensure appropriate styling (e.g., centering, text style).
        *   **If `isLocationLoading` is `false`:** Render the existing slider `div` (lines 141-154). The existing logic using `isDistanceFilterEnabled` will continue to handle the enabled/disabled state based on whether `userPosition` is available.

**Visual Plan (Mermaid Diagram):**

```mermaid
graph TD
    A[Page Load/User Action] --> B(AuthContext: Init/Auth Check);
    B -- User Identified --> C(AuthContext: Check Geolocation Permission);
    C -- Permission Granted --> D(AuthContext: fetchCoordinates);
    D -- Start Fetching --> E[Set isFetchingLocation = true];
    E --> F(navigator.geolocation.getCurrentPosition);
    F -- Success --> G[AuthContext: Set userCoordinates];
    F -- Error/Unavailable --> H[AuthContext: Clear userCoordinates, Set Status];
    G --> I[Set isFetchingLocation = false];
    H --> I;

    I --> J(WorldMap: Receives userCoordinates & isFetchingLocation from useAuth);
    J --> K(WorldMap: Passes isLocationLoading=isFetchingLocation to Sidebar);
    K --> L(Sidebar: Receives isLocationLoading);
    L -- isLocationLoading=true --> M(Sidebar: Render Loading Spinner & Text "Finding location...");
    L -- isLocationLoading=false --> N(Sidebar: Render Slider Area);
    N -- userCoordinates=null --> O(Sidebar: Render Disabled Slider);
    N -- userCoordinates!=null --> P(Sidebar: Render Enabled Slider);

    subgraph AuthContext
        direction LR
        B; C; D; E; F; G; H; I;
    end

    subgraph WorldMap
        J; K;
    end

    subgraph Sidebar
        L; M; N; O; P;
    end