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
ADD COLUMN is_local TEXT NULL,
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
-- ==============================================

-- STEP 1: Enable PostGIS Extension (Run this in Supabase SQL Editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- STEP 2: Drop the old function signature (Run this first if replacing)
DROP FUNCTION IF EXISTS public.get_snapped_map_users();

-- STEP 3: Create the Function (Updated Version with is_local, budget, bio)
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
        -- Select new profile fields
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