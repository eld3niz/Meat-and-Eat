# Feature Plan: User Location Cluster Coloring

**Objective:** Modify the map's marker clustering behavior so that any cluster containing the current user's location is colored red (`bg-red-500`), while all other clusters are colored blue (`bg-blue-500`). This distinction should apply at all zoom levels where clustering occurs. Blue clusters should have a uniform appearance, without size or color variations based on count.

**Implementation Steps:**

1.  **Modify `src/components/Map/MarkerCluster.tsx`:**
    *   Locate the `iconCreateFunction` within the component.
    *   **Retain User Check:** Keep the existing logic (approx. lines 55-66) that iterates through `childMarkers` and compares their `LatLng` with the `userCoordinates` prop to set the `clusterContainsUser` boolean flag.
    *   **Remove Variation Logic:** Delete or comment out the code blocks responsible for:
        *   Checking for `allUsersSameSpot` (approx. lines 69-79).
        *   Applying different sizes/colors based on `childCount` (approx. lines 96-99).
        *   Checking for `allUsersSameSpot` when determining `bgClass` (approx. lines 90-94).
    *   **Set Uniform Size:** Define a standard size class variable:
        ```typescript
        const sizeClass = 'w-8 h-8 text-xs'; // Standard size for all clusters
        ```
    *   **Conditional Coloring:** Determine the appropriate Tailwind CSS classes for background and border based solely on the `clusterContainsUser` flag:
        ```typescript
        let clusterColorClass = '';
        if (clusterContainsUser) {
            clusterColorClass = 'bg-red-500 border-red-600'; // Red style
        } else {
            clusterColorClass = 'bg-blue-500 border-blue-600'; // Blue style
        }
        ```
    *   **Update HTML Template:** Modify the `html` variable definition (approx. line 102) to use the `sizeClass` and `clusterColorClass`. Remove references to `bgClass` and `extraClasses`:
        ```typescript
        const html = `<div class="flex items-center justify-center ${sizeClass} ${clusterColorClass} text-white font-semibold rounded-full border-2 border-white shadow-md"><span>${childCount}</span></div>`;
        ```
    *   **Verify Icon Sizing:** Ensure the `iconSize` and `iconAnchor` calculations (approx. lines 107-108) correctly reflect the dimensions defined in `sizeClass` (e.g., `w-8` corresponds to `32px`).

2.  **Modify `src/index.css`:**
    *   **Remove Blinking Style:** Delete the CSS rule definition for `.user-cluster-blinking`.
    *   **Rely on Tailwind:** No new CSS rules are required for the red/blue cluster colors, as Tailwind will automatically generate the necessary utility classes (`bg-red-500`, `border-red-600`, `bg-blue-500`, `border-blue-600`) based on their usage in `MarkerCluster.tsx`.

**Logic Flow Diagram (`iconCreateFunction`):**

```mermaid
graph TD
    A[Start iconCreateFunction] --> B{Get childMarkers & userCoordinates};
    B --> C{clusterContainsUser = false};
    C --> D{Loop through childMarkers};
    D -- For Each Marker --> E{Marker LatLng == userCoordinates?};
    E -- Yes --> F[Set clusterContainsUser = true, Break Loop];
    E -- No --> D;
    F --> G[End Loop];
    D -- Loop Finished --> G;
    G --> H{clusterContainsUser?};
    H -- Yes --> I[clusterColorClass = 'bg-red-500 border-red-600'];
    H -- No --> J[clusterColorClass = 'bg-blue-500 border-blue-600'];
    I --> K[Set sizeClass = 'w-8 h-8 text-xs']; // Uniform size
    J --> K;
    K --> L[Generate HTML with sizeClass & clusterColorClass];
    L --> M[Calculate iconSize/Anchor based on sizeClass];
    M --> N[Return DivIcon];