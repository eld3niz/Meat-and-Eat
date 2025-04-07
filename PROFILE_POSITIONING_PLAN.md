# Plan: Position Profile View Next to List Popup

**Goal:** Modify the map interaction so that clicking a user in the cluster list popup keeps the list open and displays the user's profile view immediately to the left of the list popup, ensuring proper positioning, closing behavior, and z-index management.

**Affected Components:**

*   `src/components/Map/WorldMap.tsx` (Primary logic)
*   `src/components/Profile/ReadOnlyUserProfile.tsx` (Minor addition for close button)

**Detailed Steps:**

1.  **State Management (`WorldMap.tsx`):**
    *   Introduce state to store the screen position/dimensions of the list popup (`aggregatePopupRef`).
        ```typescript
        interface PopupPosition { top: number; left: number; width: number; height: number; }
        const [listPopupPosition, setListPopupPosition] = useState<PopupPosition | null>(null);
        ```
    *   Keep the existing `viewingProfileUserId` state.

2.  **Modify Cluster Click Handler (`handleAggregateTileClick` in `WorldMap.tsx`):**
    *   In the `onUserClick` callback (around lines 444-449):
        *   **Remove** the line: `aggregatePopupRef.current?.remove();`
        *   **Add** logic to capture the list popup's position *before* setting `viewingProfileUserId`:
            ```typescript
            const listPopupElement = aggregatePopupRef.current?.getElement();
            if (listPopupElement) {
              const rect = listPopupElement.getBoundingClientRect();
              setListPopupPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
            } else {
              setListPopupPosition(null); // Handle error case
            }
            setViewingProfileUserId(userId); // Keep this
            ```

3.  **Enhance Profile Component (`ReadOnlyUserProfile.tsx`):**
    *   Add an optional `onClose?: () => void;` prop to its interface.
    *   Add a close ('X') button (e.g., top-right).
    *   Attach `props.onClose?.()` to the button's `onClick`.

4.  **Render and Position Profile View (`WorldMap.tsx`):**
    *   Locate the conditional rendering of `<ReadOnlyUserProfile>` (around lines 780-785).
    *   Wrap it in a `div` with a `ref` (e.g., `profileWrapperRef`) and a CSS class (e.g., `profile-view-wrapper`).
    *   Apply initial styles to the wrapper: `position: fixed`, `top: listPopupPosition?.top ?? 0`, `left: 0`, `visibility: hidden`, `zIndex: 1000` (adjust as needed).
    *   Pass the close handler: `onClose={() => { setViewingProfileUserId(null); setListPopupPosition(null); }}`.
    *   Add a `useEffect` hook watching `viewingProfileUserId` and `listPopupPosition`:
        *   If profile should be visible and refs/state are valid:
            *   Measure `profileWrapperRef.current.offsetWidth`.
            *   Calculate `desiredLeft = listPopupPosition.left - profileWidth - 10` (10px gap).
            *   Update wrapper style: `left = \`${desiredLeft}px\``, `visibility = 'visible'`.
        *   If profile should be hidden, ensure `visibility: 'hidden'` or similar.

5.  **Update Profile Position on Map Move (`WorldMap.tsx`):**
    *   Modify `debouncedHandleMapMove` and `throttledHandleZoom` (or a combined handler).
    *   If `viewingProfileUserId` is set and `aggregatePopupRef.current` exists:
        *   Get updated screen position of `aggregatePopupRef.current.getElement()`.
        *   Update `listPopupPosition` state. The `useEffect` from Step 4 will handle repositioning.

6.  **Handle Closing Logic (`WorldMap.tsx`):**
    *   **'X' Button:** Handled in Step 4 via `onClose` prop.
    *   **List Popup Close:** Modify the `'remove'` event listener on the `aggregatePopupRef` (around line 462) to *also* call `setViewingProfileUserId(null)` and `setListPopupPosition(null)`.
    *   **Map Click:** Modify `handleMapClick` (lines 278-291):
        *   Add `targetElement.closest('.profile-view-wrapper')` to the `if` condition to prevent closing when clicking inside the profile.
        *   In the closing part (after the `if`), explicitly call `setViewingProfileUserId(null)` and `setListPopupPosition(null)`.

7.  **Z-Index Management (`WorldMap.tsx` / CSS):**
    *   Set `zIndex: 1000` (or higher) on the `.profile-view-wrapper`.
    *   *Action during implementation:* Inspect the z-index of the header and sidebar (`Header.tsx`, `Sidebar.tsx`) and adjust the profile wrapper's z-index if necessary to ensure it appears correctly relative to them (likely needs to be higher than the list popup but potentially lower than a fully overlaid header/sidebar).

## Mermaid Diagram

```mermaid
graph TD
    A[Start: User clicks user in List Popup] --> B{WorldMap: onUserClick};
    B --> C[Get List Popup Element];
    C --> D{Element Found?};
    D -- Yes --> E[Get Bounding Rect];
    E --> F[Set listPopupPosition State];
    F --> G[Set viewingProfileUserId State];
    D -- No --> H[Set listPopupPosition = null];
    H --> G;

    G --> I{Render ReadOnlyUserProfile?};
    I -- Yes --> J[Render Profile in Wrapper Div (fixed pos, initially hidden)];
    J --> K[useEffect: Profile Rendered?];
    K -- Yes --> L[Measure Profile Width];
    L --> M[Calculate Left Position (ListLeft - ProfileWidth - Gap)];
    M --> N[Update Wrapper Style: Set Left, Set Visibility=visible];
    I -- No --> Z[End / Hide Profile];

    subgraph Map Interaction
        O[User Pans/Zooms Map] --> P{WorldMap: Map Move/Zoom Handler};
        P --> Q{Profile Open?};
        Q -- Yes --> R[Get List Popup Element];
        R --> S{Element Found?};
        S -- Yes --> T[Get Updated Bounding Rect];
        T --> U[Set listPopupPosition State];
        U --> V[useEffect Repositions Profile];
        Q -- No --> Z;
        S -- No --> Z;
    end

    subgraph Closing Logic
        W[User clicks Profile Close Button] --> X[WorldMap: onClose handler];
        X --> Y[Set viewingProfileUserId = null & listPopupPosition = null];
        Y --> Z;

        AA[List Popup Closes (Leaflet 'remove')] --> BB[WorldMap: 'remove' handler];
        BB --> Y;

        CC[User clicks Map (outside popups/profile)] --> DD[WorldMap: handleMapClick];
        DD --> Y;
    end

    subgraph Styling
        N --> EE[Apply z-index to Wrapper Div];
        EE --> FF[Ensure z-index > List Popup & considers Header/Sidebar];
    end