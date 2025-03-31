# Map Interaction Fix Plan (Revised)

## Issues to Address

1.  **SVG Path Error:** `Error: <path> attribute d: Expected arc flag ('0' or '1')` occurs when changing the distance radius slider while an info window is open.
2.  **Info Window Auto-Close:** Info windows should close automatically if the user pans/zooms the map such that the associated marker is no longer visible.
3.  **Incorrect Hover Behavior:** The hover preview popup incorrectly appears even when a main info window is already open.
4.  **Service Worker Error:** A `TypeError: Failed to fetch` occurs in `sw.js` (acknowledged, but deferred).

## Proposed Implementation Steps

1.  **Implement Info Window Auto-Close:**
    *   Modify the `debouncedHandleMapMove` function in `src/components/Map/WorldMap.tsx`.
    *   Inside the function, after updating map state, check if `clickedCity` is set.
    *   If yes, get the map's current bounds (`mapRef.current.getBounds()`).
    *   Check if `clickedCity`'s coordinates are within the bounds (`bounds.contains()`).
    *   If the coordinates are *not* within bounds, call `setClickedCity(null)`.

2.  **Fix Hover Behavior:**
    *   Investigate hover event handling within `src/components/Map/MarkerCluster.tsx`.
    *   Modify the logic to ensure that hover events (`onMarkerMouseOver`) are ignored or handled differently if `clickedCity` is not null in the parent `WorldMap` component. This might involve passing `clickedCity` state down or adjusting event listeners within `MarkerCluster`.

3.  **Address SVG Error:**
    *   Implement steps 1 and 2 first.
    *   Test the radius slider interaction again.
    *   If the SVG error persists, further investigation is needed, potentially focusing on how `MarkerCluster` or `InfoPopup` re-render when the list of `displayedCities` changes due to the radius filter.

4.  **Address `sw.js` Error:**
    *   Tackle this separately after resolving the primary map interaction issues if it still occurs.

## Plan Visualization

```mermaid
graph TD
    A[Start] --> B{Analyze Feedback & Confirmation};
    B --> C[Plan: Info Window Auto-Close];
    B --> D[Plan: Fix Hover Behavior (Investigate MarkerCluster)];
    B --> E[Plan: Revisit SVG Error after fixes];
    B --> F[Acknowledge sw.js Error];
    C --> G{Revised Plan Ready};
    D --> G;
    E --> G;
    F --> G;
    G --> H{Implement Plan Steps};