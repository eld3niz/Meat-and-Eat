# Plan: Location-Based User Status (Local/Traveller)

This document outlines the plan to replace the manual 'local'/'traveller' selection with an automated system based on the distance between a user's set home location and their current location.

## I. Backend Changes (Supabase SQL)

1.  **Modify `profiles` Table:**
    *   Add columns for home location coordinates and the last update timestamp.
    *   Remove the old `is_local` column.

    ```sql
    -- Add columns for home location
    ALTER TABLE public.profiles
    ADD COLUMN home_latitude DOUBLE PRECISION NULL,
    ADD COLUMN home_longitude DOUBLE PRECISION NULL,
    ADD COLUMN home_location_last_updated TIMESTAMPTZ NULL;

    -- Remove the old column (ensure data migration/backup if needed)
    ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS is_local;
    ```

2.  **Create `update_home_location` Function:**
    *   Implement a function to handle the update logic, including the 30-day check. This provides better security and encapsulation.

    ```sql
    CREATE OR REPLACE FUNCTION update_home_location(p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION)
    RETURNS TEXT -- Return a status message
    LANGUAGE plpgsql
    SECURITY INVOKER -- Run as the calling user, respecting RLS
    AS $$
    DECLARE
        last_update TIMESTAMPTZ;
        allowed_interval INTERVAL := '30 days';
        current_user_id UUID := auth.uid(); -- Get the ID of the calling user
    BEGIN
        -- Get the last update time for the current user
        SELECT home_location_last_updated INTO last_update
        FROM public.profiles
        WHERE id = current_user_id;

        -- Check if update is allowed
        IF last_update IS NULL OR last_update <= now() - allowed_interval THEN
            -- Perform the update
            UPDATE public.profiles
            SET
                home_latitude = p_latitude,
                home_longitude = p_longitude,
                home_location_last_updated = now()
            WHERE id = current_user_id;

            RETURN 'Home location updated successfully.';
        ELSE
            -- Update not allowed, return informative message
            RETURN 'Update failed: Home location can only be updated once every ' || allowed_interval::TEXT || '. Next update possible after ' || (last_update + allowed_interval)::DATE::TEXT || '.';
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'An error occurred: ' || SQLERRM;
    END;
    $$;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.update_home_location(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
    ```

3.  **Modify `get_snapped_map_users` Function (from `supabase_sql_queries.md`):**
    *   Remove the `is_local` field from the function's return type and SELECT statement, as it will no longer exist in the `profiles` table. (Requires manual update of the function definition in Supabase SQL editor).

## II. Frontend Changes (React/TypeScript)

1.  **Dependencies:**
    *   Install Leaflet, React Leaflet, Leaflet Geosearch, and their types:
        `npm install leaflet react-leaflet leaflet-geosearch @types/leaflet @types/leaflet-geosearch`
    *   Add a Haversine function for distance calculation (either write a simple one or install a library like `haversine-distance`).

2.  **Signup Form (`src/components/Auth/`):**
    *   **`MultiStepRegisterForm.tsx`:**
        *   Update `formData` state: remove `is_local`, add `home_latitude: number | null`, `home_longitude: number | null`.
        *   Modify `handleSubmit`: Remove `is_local`, add `home_latitude`, `home_longitude`, and set `home_location_last_updated: new Date().toISOString()` in the `profileDataToUpsert`.
    *   **`RegisterSlideNew1.tsx`:**
        *   Remove the "Are you a local?" dropdown.
        *   Integrate a new component (e.g., `LocationSearchMap.tsx`) using `react-leaflet` and `leaflet-geosearch`.
        *   This component should display a map and search bar. On location selection, it calls `updateFormData` with `latitude` and `longitude`.
        *   Include instructions and allow skipping (coordinates remain `null`).

3.  **Account Editing (`src/components/Auth/UserProfile.tsx`):**
    *   **State & Fetching:**
        *   Remove `is_local` from `ProfileData` interface and `editIsLocal` state.
        *   Add state for `editHomeLatitude`, `editHomeLongitude`, `editHomeLocationLastUpdated`.
        *   Update `fetchProfile` to select the new fields and set the state.
    *   **UI (Edit Mode):**
        *   Replace the `is_local` input with the `LocationSearchMap.tsx` component.
        *   Display `home_location_last_updated` and potentially disable updates based on the date.
    *   **Saving (`handleSubmit`):**
        *   Call the `update_home_location` Supabase RPC function instead of directly updating the table.
        *   Handle the success/error/warning message returned by the function.
        *   Remove `is_local` from `profileUpdates`.
    *   **UI (View Mode):**
        *   Remove static display of `is_local`. Use the status from `useUserStatus` hook.

4.  **Status Calculation & Display (`useUserStatus` Hook):**
    *   Create `src/hooks/useUserStatus.ts`.
    *   Hook logic:
        *   Get user profile (home coordinates).
        *   Get current location (`navigator.geolocation`).
        *   Calculate distance (Haversine).
        *   Return status: `'Local'` (< 100km), `'Traveller'` (>= 100km), `'Other'` (home not set), `'Unknown'` (current location unavailable).
    *   Use this hook in `UserProfile.tsx` (view mode) and other relevant components.

## III. Visual Plan (Mermaid)

```mermaid
graph TD
    subgraph Signup Flow
        A[RegisterSlide1: Email/Pass] --> B(RegisterSlide2: Name/Age);
        B --> C(RegisterSlide3: Lang/Cuisine/City);
        C --> D(RegisterSlideNew1: Map Search);
        D -- Coords --> E(RegisterSlideNew2: Bio);
        E --> F(RegisterSlideAvatar: Avatar);
        F --> G{Submit};
    end

    subgraph Data Handling
        G -- User Data + Home Coords --> H[MultiStepForm.handleSubmit];
        H -- Upsert Profile --> I[Supabase 'profiles' Table];
        I -- Store: id, ..., home_lat, home_lon, last_updated --> I;
    end

    subgraph Status Calculation (Client-Side)
        J[App Load/Login] --> K{Get User Profile};
        K -- Home Coords --> L{Get Current Location};
        L -- Current Coords --> M{Calculate Distance};
        M -- Distance --> N{Determine Status};
        N -- Status (Local/Traveller/Other) --> O[User Context/Hook];
        O --> P[UI Display];
    end

    subgraph Account Editing
        Q[Account Settings Page] --> R{Display Map Search};
        R -- New Coords --> S{Call Supabase update_home_location};
        S -- Success/Error Msg --> T[Update UI/State];
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#ccf,stroke:#333,stroke-width:2px
    style M fill:#fcf,stroke:#333,stroke-width:2px
    style S fill:#ccf,stroke:#333,stroke-width:2px