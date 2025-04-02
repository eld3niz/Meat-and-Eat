# Plan: Automatic Map Zoom on Distance Filter Change

## Goal

Implement automatic map zooming in the `WorldMap.tsx` component when the user adjusts the distance filter slider in the `Sidebar.tsx` component. The zoom level should adjust so that the circular area defined by the selected radius fits snugly between the top and bottom edges of the map view.

## Analysis Summary

-   **Sidebar (`Sidebar.tsx`):** Manages the radius slider (`distanceRange` state, 1-50km). On change, it calls the `onDistanceFilter` prop (passed from `WorldMap`) with the selected distance (or `null` for 50km/"All") after a 300ms debounce.
-   **Map (`WorldMap.tsx`):**
    -   Receives the distance via the `handleDistanceFilter` callback.
    -   Currently, this callback only updates the data filter state (`useMapData` hook) and the `distanceRadius` state (for drawing the circle).
    -   Automatic zooming on slider change was previously removed.
    -   The `handleZoomToRadius` function contains the necessary logic to calculate bounds and zoom using `map.flyToBounds`, but it's only triggered by a button.

## Proposed Plan

1.  **Modify `WorldMap.tsx` -> `handleDistanceFilter`:**
    *   Inside the `handleDistanceFilter` function (around line 123), after updating the filter state and radius, add logic to adjust the map view.
    *   Get the `map` instance from `mapRef.current`.
    *   Check if `map`, `userCoordinates`, and a valid `distance` (not `null` and > 0) are available.
    *   If a valid distance is selected (i.e., not "All"):
        *   Calculate the geographical bounds (`calculatedBounds`) required to encompass the circle defined by `userCoordinates` and the `distance` (using the same calculation logic as in `handleZoomToRadius`, lines 254-260).
        *   Call `map.fitBounds(calculatedBounds, { padding: [50, 50], animate: true, duration: 0.5 });` to smoothly adjust the map view. The `padding` ensures the circle isn't cut off, and `duration` controls animation speed. (Padding might need adjustment for exact fit).
    *   If the distance is set to "All" (`distance` is `null`), do *not* adjust the zoom automatically.
    *   Ensure `userCoordinates` is added to the `useCallback` dependency array for `handleDistanceFilter`.

## Conceptual Flow Diagram

```mermaid
sequenceDiagram
    participant Sidebar
    participant WorldMap
    participant LeafletMap

    Note over Sidebar: User drags distance slider
    Sidebar->>Sidebar: handleDistanceChange(newValue)
    Sidebar->>Sidebar: setDistanceRange(newValue)
    Note over Sidebar: Debounce(300ms) starts
    opt newValue < 50
        Note over Sidebar: Debounce ends
        Sidebar->>WorldMap: onDistanceFilter(newValue)
    else newValue >= 50
        Note over Sidebar: Debounce ends
        Sidebar->>WorldMap: onDistanceFilter(null)
    end

    WorldMap->>WorldMap: handleDistanceFilter(distance)
    WorldMap->>WorldMap: filterByDistance(distance) // Update data hook
    WorldMap->>WorldMap: setDistanceRadius(distance) // For circle drawing
    opt distance is not null and > 0
        WorldMap->>WorldMap: Calculate bounds for distance
        WorldMap->>LeafletMap: map.fitBounds(calculatedBounds, options)
    end
```

## Considerations

-   **Debounce:** The 300ms debounce from the `Sidebar` will remain for now. This means the zoom action will occur 300ms after the user stops interacting with the slider. This might be revisited if the delay feels unnatural during testing.