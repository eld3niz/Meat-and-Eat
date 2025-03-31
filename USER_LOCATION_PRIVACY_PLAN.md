# Plan: User Location Privacy & Overlap Handling

**Goal:** Implement location privacy using 1km grid snapping on the backend and adjust the frontend marker display to better handle multiple users snapped to the same grid point.

## Phase 1: Backend Changes (Supabase)

1.  **Enable PostGIS Extension:**
    *   Ensure the `postgis` extension is enabled in Supabase.
    *   Run if needed: `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;`

2.  **Create Supabase Database Function (`get_snapped_map_users`):**
    *   Define a new PostgreSQL function using `plpgsql` and `SECURITY DEFINER`.
    *   This function fetches user locations, snaps them to a ~1km grid using `ST_SnapToGrid` from PostGIS, joins with `profiles` for the name, and returns the snapped data.
    *   Grant `EXECUTE` permission to the `authenticated` role.

    ```sql
    -- Function to get user locations snapped to a grid (e.g., ~1km)
    -- Adjust grid origin and size as needed. 0.01 degrees is roughly 1.1km at the equator.
    CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
    RETURNS TABLE(user_id UUID, latitude DECIMAL, longitude DECIMAL, name TEXT)
    LANGUAGE plpgsql
    SECURITY DEFINER -- Important for accessing all locations despite RLS
    -- Set search_path to ensure function can find tables and extensions
    SET search_path = public, extensions
    AS $$
    DECLARE
        grid_size DECIMAL := 0.01; -- Approx 1.1km grid size in degrees
    BEGIN
        RETURN QUERY
        SELECT
            ul.user_id,
            -- Snap latitude and longitude to the grid center
            extensions.ST_Y(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS latitude,
            extensions.ST_X(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS longitude,
            p.name
        FROM
            public.user_locations ul
        JOIN
            public.profiles p ON ul.user_id = p.id;
        -- Optional: Add WHERE clause if needed (e.g., location_access = TRUE)
    END;
    $$;

    -- Grant execution permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;
    ```

3.  **(Optional) Update RLS:**
    *   Consider removing or restricting the broad `SELECT` policy on `public.user_locations` for the `authenticated` role to enhance privacy, as the primary access method will be the new function.

## Phase 2: Frontend Changes (React)

1.  **Update Data Fetching (`src/hooks/useMapData.ts`):**
    *   In `fetchOtherUserLocations`, replace the Supabase query `supabase.from('map_users').select(...)` with an RPC call: `supabase.rpc('get_snapped_map_users')`.
    *   Adjust data handling as needed based on the RPC response structure.

2.  **Refine Marker Clustering (`src/components/Map/MarkerCluster.tsx`):**
    *   Modify the `iconCreateFunction` within the `markerClusterOptions`.
    *   Add logic to detect if a cluster contains *only* users and *all* those users share the exact same snapped latitude/longitude.
    *   If detected, apply a distinct style to the cluster icon (e.g., change background color to green) to visually indicate multiple users at the same grid point without requiring spiderfication for that specific case.
    *   Keep the existing logic for sizing/coloring other cluster types (mixed or city-only).

## Phase 3: Data Flow Visualization

```mermaid
sequenceDiagram
    participant FE as Frontend (useMapData)
    participant Supabase
    participant DB as PostgreSQL DB (user_locations, profiles)
    participant PostGIS

    FE->>Supabase: Call RPC function get_snapped_map_users()
    Supabase->>DB: Execute get_snapped_map_users() [SECURITY DEFINER]
    DB->>DB: Query user_locations & profiles
    DB->>PostGIS: Use ST_SnapToGrid(location, 0.01) for each user
    PostGIS-->>DB: Return snapped coordinates (lat/lon)
    DB-->>Supabase: Return user_id, name, snapped_lat, snapped_lon
    Supabase-->>FE: Return list of users with snapped locations

    participant Map as Frontend (MarkerCluster)
    FE->>Map: Pass snapped user list
    Map->>Map: Process users for clustering
    Map->>Map: Detect clusters where all children are users at identical snapped coords
    Map->>Map: Create custom cluster icon (e.g., green) for these cases
    Map->>Map: Create standard cluster icons for others
    Map->>Map: Add markers/clusters to Leaflet map