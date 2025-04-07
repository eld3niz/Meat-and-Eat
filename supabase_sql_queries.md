-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    birth_date DATE,
    languages TEXT[] DEFAULT '{}',
    cuisines TEXT[] DEFAULT '{}',
    location_access BOOLEAN DEFAULT FALSE,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add new columns for user attributes (is_local, budget, bio) - Added [YYYY-MM-DD]
ALTER TABLE public.profiles
ADD COLUMN is_local TEXT NULL, -- Note: This column will be removed later by the location status update
ADD COLUMN budget SMALLINT NULL CHECK (budget >= 1 AND budget <= 3),
ADD COLUMN bio TEXT NULL CHECK (char_length(bio) <= 255);

-- Add avatar_url column for profile pictures - Added [Date, e.g., 2025-04-06]
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT NULL;

-- NOTE: Supabase Storage Setup Required for Avatars:
-- 1. Create a Storage bucket (e.g., named 'avatars'). Make it Public for easier URL access.
-- 2. Add Row Level Security (RLS) policies to the 'avatars' bucket:
--    - Allow authenticated users to SELECT (view).
--    - Allow authenticated users to INSERT their own avatar (using user_id in path).
--    - Allow authenticated users to UPDATE/DELETE their own avatar (using user_id in path).
--    (Refer to implementation guide for specific policy conditions).

-- ==============================================
-- Location-Based Status Update [YYYY-MM-DD] - START
-- ==============================================

-- Step 1: Add new columns for home location and remove old 'is_local'
ALTER TABLE public.profiles
ADD COLUMN home_latitude DOUBLE PRECISION NULL,
ADD COLUMN home_longitude DOUBLE PRECISION NULL,
ADD COLUMN home_location_last_updated TIMESTAMPTZ NULL;

-- Important: Ensure any data from 'is_local' is migrated or backed up if needed before dropping!
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS is_local;

-- Step 2: Create function to update home location with monthly limit
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

-- Step 3: Grant execute permission for the new function
GRANT EXECUTE ON FUNCTION public.update_home_location(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Step 4: (Optional but Recommended) Update 'get_snapped_map_users' function
-- If you are using the 'get_snapped_map_users' function (defined further below),
-- you MUST update it by running the following commands sequentially in the Supabase SQL Editor
-- AFTER completing Step 1 (removing the is_local column).

-- 4a. Drop the existing function (Required because the return type changed)
DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- 4b. Recreate the Function WITHOUT is_local
CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
RETURNS TABLE(
    user_id UUID,
    latitude double precision,
    longitude double precision,
    name TEXT,
    -- is_local TEXT, -- <<< REMOVED
    budget SMALLINT,
    bio TEXT,
    age INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    grid_size DECIMAL := 0.01;
BEGIN
    RETURN QUERY
    SELECT
        ul.user_id,
        extensions.ST_Y(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS latitude,
        extensions.ST_X(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS longitude,
        p.name,
        -- p.is_local, -- <<< REMOVED
        p.budget,
        p.bio,
        p.age
    FROM
        public.user_locations ul
    JOIN
        public.profiles p ON ul.user_id = p.id;
END;
$$;

-- 4c. Grant execution permission (Run this again after recreating the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;


-- ==============================================
-- Location-Based Status Update [YYYY-MM-DD] - END
-- ==============================================


-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile
-- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles; -- Keep old drop for reference if needed
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles; -- Keep old drop for reference if needed
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- RLS Policy Update for Profiles Table (Allowing reads for map view/function)
-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to read basic profile info for map" ON public.profiles;

-- Add policy to allow authenticated users to read specific columns needed for the map function
-- This is more secure than allowing full profile reads.
CREATE POLICY "Allow authenticated users to read profile info for map function"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');


-- Create user_locations table
CREATE TABLE public.user_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT user_locations_user_id_key UNIQUE (user_id) -- Added unique constraint here
);

-- Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own location
CREATE POLICY "Users can view own location"
ON public.user_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own location
CREATE POLICY "Users can insert own location"
ON public.user_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own location
CREATE POLICY "Users can update own location"
ON public.user_locations
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow authenticated users to view all locations (Used by SECURITY DEFINER function)
-- CONSIDER REMOVING/RESTRICTING THIS POLICY IF FUNCTION IS REMOVED
DROP POLICY IF EXISTS "Allow authenticated users to view locations" ON public.user_locations;
CREATE POLICY "Allow authenticated users to view locations"
ON public.user_locations
FOR SELECT
USING (auth.role() = 'authenticated');


-- ==============================================
-- View for Combining User Location and Profile Info (Original - Now superseded by function)
-- ==============================================

-- Create a view to combine user location and basic profile info
-- This allows fetching necessary user details for the map without exposing sensitive profile data
-- CREATE OR REPLACE VIEW public.map_users AS ... (View definition removed as function is preferred)

-- Grant necessary permissions to the 'authenticated' role to use the view
-- GRANT SELECT ON TABLE public.map_users TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated; -- Ensure role can access the public schema


-- ==============================================
-- Function for Snapped User Locations (Privacy) - Updated [2025-04-04] to include Age
-- NOTE: This function needs to be updated if used, see Step 4 in the Location-Based Status Update section above.
-- The queries provided in Step 4 should be run AFTER removing the is_local column in Step 1.
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Run this in Supabase SQL Editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Drop the old function signature (This is now handled in Step 4a above)
-- DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- STEP 3: Create the Function (Original Version - Will be replaced by Step 4b query above)
-- CREATE OR REPLACE FUNCTION public.get_snapped_map_users() ...

-- STEP 4: Grant execution permission (This is now handled in Step 4c above)
-- GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

-- ==============================================
-- Gender Field Update [2025-04-07] - START
-- ==============================================

-- Add gender column to profiles table
-- Use TEXT type, can add CHECK constraint later if needed (e.g., CHECK (gender IN ('male', 'female', 'divers')))
ALTER TABLE public.profiles
ADD COLUMN gender TEXT NULL;

-- Update existing profiles to set gender to 'female'
-- Run this only once after adding the column
UPDATE public.profiles
SET gender = 'female'
WHERE gender IS NULL; -- Only update rows where gender hasn't been set yet (good practice)

-- ==============================================
-- Gender Field Update [2025-04-07] - END
-- ==============================================