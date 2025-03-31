# Map Component Improvement Plan

This plan outlines the steps to address issues related to popup visibility, map instability, and InfoWindow flickering in the WorldMap component.

## Issues Addressed

1.  **Popup Overlap:** The "Alle anzeigen" popup (`MarkerDirectory` in `CityFilter.tsx`) is overlapped by the map.
2.  **Map Instability:** Clicking a city/marker causes the map to "wiggle" after the initial zoom animation.
3.  **InfoWindow Flickering:** The marker `InfoPopup` appears and disappears erratically after clicking a marker/city.
4.  **DOM Nesting Warning:** A React warning about whitespace in `<thead>` within `MarkerDirectory`.

## Proposed Solution

### 1. Fix Popup Overlap

*   **File:** `src/components/UI/CityFilter.tsx`
*   **Action:** Increase the `z-index` of the `MarkerDirectory` component's main container `div` (around line 279). Change `z-50` to `z-[1000]` using Tailwind's arbitrary value syntax. This ensures the popup renders above all map elements.

### 2. Stabilize Map Movement & InfoWindow

*   **File:** `src/components/Map/WorldMap.tsx`
*   **Action:** Introduce a state variable to track map animation:
    ```typescript
    const [isFlying, setIsFlying] = useState(false);
    ```
*   **Action:** Modify `handleCitySelect` (around line 91) and `handleMarkerClick` (around line 89):
    *   Set `setIsFlying(true)` at the start.
    *   Get the map instance: `const map = mapRef.current;`.
    *   If `map` exists, call `map.flyTo([latitude, longitude], zoom, { duration: 1.5 });` directly to initiate the animation.
    *   Use `setTimeout` to delay state updates (`setMapCenter`, `setMapZoom`, `setClickedCity`) until *after* the animation completes (e.g., 1500ms).
    *   Set `setIsFlying(false)` within the `setTimeout` callback.
    *   Remove direct state updates that occur before the `flyTo` call within these handlers.
*   **Action:** Modify `debouncedHandleMapMove` (around line 100):
    *   Add a check at the beginning: `if (isFlying || !mapRef.current) return;`. This prevents map state updates triggered by `moveend` during the `flyTo` animation.
*   **Action:** Remove the `MapCenterController` component (lines 21-25) as `flyTo` is now handled directly. Ensure `MapContainer` props (`center`, `zoom`) are still updated by the state changes within the `setTimeout`.

### 3. Address DOM Warning

*   **Action:** Re-evaluate after implementing the fixes above. The warning might resolve as a side effect of stabilizing the rendering logic. If it persists, further investigation of the `<thead>` structure in `MarkerDirectory` will be needed.

## Implementation Diagram (Map Movement Stabilization)

```mermaid
graph TD
    subgraph "City/Marker Click"
        A[Click Event] --> B{Set isFlying = true};
        B --> C[map.flyTo(coords, zoom)];
        C --> D[setTimeout(1500ms)];
        D --> E{Update mapCenter/Zoom State};
        E --> F{Update clickedCity State};
        F --> G{Set isFlying = false};
    end

    subgraph "Map Move End"
        H[moveend Event] --> I[debouncedHandleMapMove];
        I --> J{isFlying?};
        J -- Yes --> K[Return / Do Nothing];
        J -- No --> L{Update mapCenter State};
    end

    M[Remove MapCenterController]

    A --> M;
    H;