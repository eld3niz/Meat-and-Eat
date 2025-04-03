# Feature Plan: Map Resize on Sidebar Toggle

## Problem

When the filter sidebar is hidden, the Leaflet map container does not expand to fill the newly available space, leaving visual gaps. When the sidebar reappears, the map should revert to its original size.

## Proposed Solution

The core idea is to lift the state controlling the sidebar's visibility (`isCollapsed`) from the `Sidebar` component to the parent `WorldMap` component. This allows the `WorldMap` component to react when the sidebar's state changes and explicitly tell the Leaflet map instance to resize itself.

### Steps

1.  **Lift State:**
    *   Remove the `isCollapsed` state (`useState`) from `src/components/UI/Sidebar.tsx`.
    *   Add an `isSidebarCollapsed` state (`useState`) to `src/components/Map/WorldMap.tsx`.
    *   Add a `handleToggleSidebar` function in `WorldMap.tsx` to update this state.

2.  **Pass State Down:**
    *   Modify the `SidebarProps` interface in `src/components/UI/Sidebar.tsx` to include `isCollapsed: boolean` and `onToggleCollapse: () => void`.
    *   Update the `Sidebar` component to use the `isCollapsed` prop for styling and the `onToggleCollapse` prop for the toggle button's `onClick` handler.
    *   Pass `isCollapsed={isSidebarCollapsed}` and `onToggleCollapse={handleToggleSidebar}` as props from `WorldMap.tsx` when rendering the `<Sidebar>` component.

3.  **Trigger Map Resize:**
    *   Add a `useEffect` hook in `src/components/Map/WorldMap.tsx` that depends on the `isSidebarCollapsed` state.
    *   Inside this effect, obtain the Leaflet map instance using the existing `mapRef`.
    *   If the map instance exists, call `mapRef.current.invalidateSize()` after a short delay (e.g., 350ms) to allow the sidebar's CSS transition to complete. This ensures the map resizes smoothly after the sidebar animation finishes.

### Flow Diagram

```mermaid
graph TD
    A[User Clicks Toggle Button in Sidebar] --> B{Sidebar: onClick calls onToggleCollapse prop};
    B --> C{WorldMap: handleToggleSidebar updates isSidebarCollapsed state};
    C --> D{WorldMap: Re-renders with new isSidebarCollapsed state};
    D -- Props --> E[Sidebar: Receives new isCollapsed prop, updates its width via CSS];
    D -- State Change --> F{WorldMap useEffect[isSidebarCollapsed]};
    F -- After Delay (350ms) --> G{WorldMap: Calls map.invalidateSize()};
    G --> H[Map: Resizes to fill available space];
```

## Implementation

The implementation will involve modifying the following files:

*   `src/components/UI/Sidebar.tsx`
*   `src/components/Map/WorldMap.tsx`

These changes will be handled in Code mode.