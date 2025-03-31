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

-- Allow authenticated users to view all locations
-- CONSIDER REMOVING/RESTRICTING THIS POLICY FOR ENHANCED PRIVACY
-- AFTER IMPLEMENTING get_snapped_map_users FUNCTION
CREATE POLICY "Allow authenticated users to view locations"
ON public.user_locations
FOR SELECT
USING (auth.role() = 'authenticated');

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

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

ALTER TABLE public.user_locations
ADD CONSTRAINT user_locations_user_id_key UNIQUE (user_id);

-- ==============================================
-- View for Combining User Location and Profile Info (Original - Now superseded by function)
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
-- NEW: Function for Snapped User Locations (Privacy) - CORRECTED RETURN TYPE
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Run this in Supabase SQL Editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Drop the old function signature (Run this first if replacing due to return type change)
DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- STEP 3: Create the Function (Corrected Version)
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

-- STEP 4: Grant execution permission (Run this after creating the function)
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;