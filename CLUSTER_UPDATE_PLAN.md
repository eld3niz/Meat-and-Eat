# Cluster Update Implementation Plan

This plan outlines the steps to modify map clustering behavior, update cluster styling for the user's location, and add a "Zoom to Me" button.

## Phase 1: Information Gathering & Analysis (Completed)

1.  **Re-examine `MarkerCluster.tsx`:** Analyze `markerClusterOptions` and `iconCreateFunction`.
2.  **Examine `WorldMap.tsx`:** Analyze map controls structure and identify zoom-to-user function.
3.  **Examine `UserLocationMarker.tsx`:** Check for existing blinking CSS classes.
4.  **Examine `src/index.css`:** Check for existing blinking animations or plan a new one.

## Phase 2: Implementation Steps

1.  **Modify `MarkerCluster.tsx`:**
    *   Update `markerClusterOptions` to set `spiderfyOnMaxZoom: false`.
    *   Pass the `userCoordinates` prop from `WorldMap.tsx` down to `MarkerCluster.tsx`.
    *   Modify the `iconCreateFunction`:
        *   Get all child markers using `cluster.getAllChildMarkers()`.
        *   Check if any child marker's coordinates match the passed `userCoordinates`.
        *   If a match is found, add a specific CSS class (e.g., `user-cluster-blinking`) to the generated HTML `div` for the cluster icon.
        *   Ensure default cluster styling is overridden when the user is present.
2.  **Modify `WorldMap.tsx`:**
    *   Add the `userCoordinates` prop to the `<MarkerCluster>` component invocation.
    *   Add a new `Button` component inside the main map container `div`, positioned absolutely (top-right, z-index 1000).
    *   The button's `onClick` handler will call the existing `handleUserMarkerClick` function.
3.  **Modify CSS (`src/index.css`):**
    *   Define `@keyframes` for a red blinking effect.
    *   Define the `.user-cluster-blinking` class:
        *   Set background/border color to red.
        *   Apply the blinking animation.
        *   Ensure it overrides default cluster styles.

## Phase 3: User Confirmation & Next Steps (Completed)

1.  Present plan for review.
2.  Confirm plan with user.
3.  Save plan to Markdown (this file).
4.  Switch to 'Code' mode for implementation.

## Diagram

```mermaid
graph TD
    subgraph WorldMap.tsx
        A[WorldMap Component]
        B(MapContainer)
        C(MarkerCluster)
        D(ZoomToMeButton)
        E[handleUserMarkerClick]
        F[userCoordinates]
    end

    subgraph MarkerCluster.tsx
        G[MarkerCluster Component]
        H(markerClusterOptions)
        I(iconCreateFunction)
        J[userCoordinates Prop]
    end

    subgraph CSS
        K[index.css]
        L(user-cluster-blinking class)
        M(blink animation)
    end

    A -- Contains --> B;
    A -- Contains --> C;
    A -- Contains --> D;
    A -- Defines --> E;
    A -- Holds state --> F;

    F -- Passed as prop --> C;
    C -- Uses prop --> J;
    J -- Used by --> I;
    I -- Modifies --> H;
    I -- Applies class --> L;

    D -- onClick triggers --> E;
    E -- Uses --> F;
    E -- Interacts with --> B;

    G -- Defines --> H;
    G -- Defines --> I;
    G -- Receives prop --> J;

    K -- Defines --> L;
    K -- Defines --> M;
    L -- Uses --> M;