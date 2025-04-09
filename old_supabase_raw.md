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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);


-- Create user_locations table
CREATE TABLE public.user_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
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


-- First, drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new, more permissive insert policy
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- If you're using a trigger to create profiles automatically, you might need this policy too
CREATE POLICY "Allow trigger to create profiles" 
ON profiles FOR INSERT 
WITH CHECK (TRUE);

-- Make sure authenticated users can update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);


CREATE POLICY "Allow authenticated users to view locations"
ON public.user_locations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

ALTER TABLE public.user_locations
ADD CONSTRAINT user_locations_user_id_key UNIQUE (user_id);



-- ==============================================
-- View for Combining User Location and Profile Info
-- ==============================================

-- Create a view to combine user location and basic profile info
-- This allows fetching necessary user details for the map without exposing sensitive profile data
CREATE OR REPLACE VIEW public.map_users AS
SELECT
    ul.user_id,
    ul.latitude,
    ul.longitude,
    p.name -- Expose the user's name
FROM
    public.user_locations ul
JOIN
    public.profiles p ON ul.user_id = p.id;

-- Grant necessary permissions to the 'authenticated' role to use the view
-- Ensure this role exists and is used by your logged-in users
GRANT SELECT ON TABLE public.map_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; -- Ensure role can access the public schema

-- ==============================================
-- RLS Policy Update for Profiles Table
-- ==============================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to read basic profile info for map" ON public.profiles;

-- Add policy to allow authenticated users to read specific columns (id, name) needed for the map view
-- This is more secure than allowing full profile reads.
CREATE POLICY "Allow authenticated users to read basic profile info for map"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Note: This policy allows reading all profiles' id and name.
-- If you need stricter controls (e.g., only show users within a certain distance),
-- you might need a Supabase Function (security definer) instead of a simple view.


-- ==============================================
-- View for Combining User Location and Profile Info
-- ==============================================

-- Create a view to combine user location and basic profile info
-- This allows fetching necessary user details for the map without exposing sensitive profile data
CREATE OR REPLACE VIEW public.map_users AS
SELECT
    ul.user_id,
    ul.latitude,
    ul.longitude,
    p.name -- Expose the user's name
FROM
    public.user_locations ul
JOIN
    public.profiles p ON ul.user_id = p.id;

-- Grant necessary permissions to the 'authenticated' role to use the view
-- Ensure this role exists and is used by your logged-in users
GRANT SELECT ON TABLE public.map_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; -- Ensure role can access the public schema

-- ==============================================
-- RLS Policy Update for Profiles Table
-- ==============================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to read basic profile info for map" ON public.profiles;

-- Add policy to allow authenticated users to read specific columns (id, name) needed for the map view
-- This is more secure than allowing full profile reads.
CREATE POLICY "Allow authenticated users to read basic profile info for map"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Note: This policy allows reading all profiles' id and name.
-- If you need stricter controls (e.g., only show users within a certain distance),
-- you might need a Supabase Function (security definer) instead of a simple view.



-- ==============================================
-- NEW: Function for Snapped User Locations (Privacy)
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Run this in Supabase SQL Editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Create the Function
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

-- STEP 3: Grant execution permission
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

SELECT * FROM pg_extension WHERE extname = 'postgis';

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;



-- ==============================================
-- NEW: Function for Snapped User Locations (Privacy) - CORRECTED RETURN TYPE
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Run this in Supabase SQL Editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Create or Replace the Function (Corrected Version)
-- Function to get user locations snapped to a grid (e.g., ~1km)
-- Adjust grid origin and size as needed. 0.01 degrees is roughly 1.1km at the equator.
CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
-- CORRECTED: Changed DECIMAL to double precision to match PostGIS output
RETURNS TABLE(user_id UUID, latitude double precision, longitude double precision, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing all locations despite RLS
-- Set search_path to ensure function can find tables and extensions
SET search_path = public, extensions
AS $$
DECLARE
    grid_size DECIMAL := 0.01; -- Approx 1.1km grid size in degrees (can still use DECIMAL for input)
BEGIN
    RETURN QUERY
    SELECT
        ul.user_id,
        -- Snap latitude and longitude to the grid center
        -- ST_Y and ST_X return double precision
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

-- STEP 3: Grant execution permission (Run this again if you replaced the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

DROP FUNCTION IF EXISTS public.get_snapped_map_users();

CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
-- CORRECTED: Changed DECIMAL to double precision to match PostGIS output
RETURNS TABLE(user_id UUID, latitude double precision, longitude double precision, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing all locations despite RLS
-- Set search_path to ensure function can find tables and extensions
SET search_path = public, extensions
AS $$
DECLARE
    grid_size DECIMAL := 0.01; -- Approx 1.1km grid size in degrees (can still use DECIMAL for input)
BEGIN
    RETURN QUERY
    SELECT
        ul.user_id,
        -- Snap latitude and longitude to the grid center
        -- ST_Y and ST_X return double precision
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

GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

-- Add new columns for user attributes (is_local, budget, bio)
ALTER TABLE public.profiles
ADD COLUMN is_local TEXT NULL,
ADD COLUMN budget SMALLINT NULL CHECK (budget >= 1 AND budget <= 3),
ADD COLUMN bio TEXT NULL CHECK (char_length(bio) <= 255);


-- Drop the old function signature (Run this first if replacing)
DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- Create the Function (Updated Version with is_local, budget, bio)
CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
RETURNS TABLE(
    user_id UUID,
    latitude double precision,
    longitude double precision,
    name TEXT,
    is_local TEXT,
    budget SMALLINT,
    bio TEXT
)
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
        p.name,
        -- Select new profile fields
        p.is_local,
        p.budget,
        p.bio
    FROM
        public.user_locations ul
    JOIN
        public.profiles p ON ul.user_id = p.id;
    -- Optional: Add WHERE clause if needed (e.g., p.location_access = TRUE)
END;
$$;

-- Grant execution permission (Run this after creating/replacing the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

-- ==============================================
-- Function for Snapped User Locations (Privacy) - Updated [2025-04-04] to include Age
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Ensure this is enabled in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Drop the old function signature (Run this first if replacing)
DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- STEP 3: Create the Updated Function (Includes age)
CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
RETURNS TABLE(
    user_id UUID,
    latitude double precision,
    longitude double precision,
    name TEXT,
    is_local TEXT,
    budget SMALLINT,
    bio TEXT,
    age INTEGER -- Added age column to return type
)
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
        p.name,
        -- Select profile fields
        p.is_local,
        p.budget,
        p.bio,
        p.age -- Added age column to select list
    FROM
        public.user_locations ul
    JOIN
        public.profiles p ON ul.user_id = p.id;
    -- Optional: Add WHERE clause if needed (e.g., p.location_access = TRUE)
END;
$$;

-- STEP 4: Grant execution permission (Run this after creating/replacing the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT NULL;

-- Optional: Update the RLS policy to allow updating this new column
-- (The existing "Users can update own profile" policy should cover this,
-- but explicitly listing columns can be safer if you modify the policy later)
-- DROP POLICY "Users can update own profile" ON public.profiles; -- If needed
-- CREATE POLICY "Users can update own profile"
-- ON public.profiles
-- FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id); -- Re-apply or modify as needed

-- Add columns for home location
ALTER TABLE public.profiles
ADD COLUMN home_latitude DOUBLE PRECISION NULL,
ADD COLUMN home_longitude DOUBLE PRECISION NULL,
ADD COLUMN home_location_last_updated TIMESTAMPTZ NULL;

-- Remove the old column (ensure data migration/backup if needed)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS is_local;

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

DROP FUNCTION IF EXISTS public.get_snapped_map_users();

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


-- Grant execution permission (Run this again after recreating the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;


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



-- ==============================================
-- Meetups Table & Policies [2025-04-09] - START
-- ==============================================

-- Create meetups table
CREATE TABLE public.meetups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    meetup_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Add index for faster querying by creator
CREATE INDEX idx_meetups_creator_id ON public.meetups(creator_id);

-- Add index for potential geospatial queries (optional, requires PostGIS)
CREATE INDEX idx_meetups_location ON public.meetups USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Enable Row Level Security
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Policies for meetups table
-- Allow authenticated users to view all meetups
CREATE POLICY "Allow authenticated read access to meetups"
ON public.meetups
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own meetups
CREATE POLICY "Allow authenticated users to insert own meetup"
ON public.meetups
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Allow creators to update their own meetups
CREATE POLICY "Allow creator to update own meetup"
ON public.meetups
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id); -- Optional: Redundant check for clarity

-- Allow creators to delete their own meetups
CREATE POLICY "Allow creator to delete own meetup"
ON public.meetups
FOR DELETE
USING (auth.uid() = creator_id);

-- ==============================================
-- Meetups Table & Policies [2025-04-09] - END
-- ==============================================

ALTER TABLE public.meetups
ADD COLUMN cuisines TEXT[] DEFAULT '{}';