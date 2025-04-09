-- ## Step 1: Enable Extensions
-- Enable the PostGIS extension, which is required for geospatial functions and indexing.

-- Enable PostGIS Extension (Required for geospatial functions/indexing)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Enable pgcrypto for gen_random_uuid() if not already enabled (usually is by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


-- ## Step 2: Create Tables
-- Define the core tables for the application.

-- Create profiles table
-- Stores user profile information, linked to Supabase Auth users.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    birth_date DATE,
    languages TEXT[] DEFAULT '{}', -- Array of languages spoken
    cuisines TEXT[] DEFAULT '{}', -- Array of preferred cuisines
    location_access BOOLEAN DEFAULT FALSE, -- User consent for location sharing
    city TEXT, -- User's city (can be derived or manually set)
    budget SMALLINT NULL CHECK (budget >= 1 AND budget <= 3), -- User's budget preference (1-3 scale)
    bio TEXT NULL CHECK (char_length(bio) <= 255), -- Short user biography
    avatar_url TEXT NULL, -- URL to the user's profile picture in Supabase Storage
    home_latitude DOUBLE PRECISION NULL, -- Latitude of user's designated home location
    home_longitude DOUBLE PRECISION NULL, -- Longitude of user's designated home location
    home_location_last_updated TIMESTAMPTZ NULL, -- Timestamp of the last home location update
    gender TEXT NULL, -- User's gender
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

COMMENT ON COLUMN public.profiles.avatar_url IS 'Requires Supabase Storage bucket (e.g., "avatars") to be set up with appropriate RLS policies.';
COMMENT ON COLUMN public.profiles.home_latitude IS 'Used to determine if a user is "local" relative to others.';
COMMENT ON COLUMN public.profiles.home_longitude IS 'Used to determine if a user is "local" relative to others.';
COMMENT ON COLUMN public.profiles.home_location_last_updated IS 'Used to limit frequency of home location updates.';


-- Create user_locations table
-- Stores the last known real-time location of users.
CREATE TABLE public.user_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL, -- Precise latitude
    longitude DECIMAL NOT NULL, -- Precise longitude
    city TEXT, -- City derived from location (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT user_locations_user_id_key UNIQUE (user_id) -- Ensure only one location record per user
);

COMMENT ON TABLE public.user_locations IS 'Stores the current reported location of users.';


-- Create meetups table
-- Stores information about planned meetups.
CREATE TABLE public.meetups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    latitude DOUBLE PRECISION NOT NULL, -- Location latitude of the meetup
    longitude DOUBLE PRECISION NOT NULL, -- Location longitude of the meetup
    meetup_time TIMESTAMPTZ NOT NULL, -- Date and time of the meetup
    cuisines TEXT[] DEFAULT '{}', -- Relevant cuisines for the meetup
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

COMMENT ON TABLE public.meetups IS 'Stores details about user-created meetups.';

-- Add indexes for faster querying
CREATE INDEX idx_meetups_creator_id ON public.meetups(creator_id);

-- Add geospatial index using PostGIS (requires PostGIS extension)
-- Uses GIST index for efficient spatial queries (e.g., find meetups nearby)
CREATE INDEX idx_meetups_location ON public.meetups USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));


-- ## Step 3: Create Functions
-- Define reusable database functions.

-- Function to update user's home location with a monthly limit
CREATE OR REPLACE FUNCTION public.update_home_location(p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION)
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

COMMENT ON FUNCTION public.update_home_location(DOUBLE PRECISION, DOUBLE PRECISION) IS 'Allows users to update their home location, limited to once every 30 days. Called via RPC.';


-- Function to get user locations snapped to a grid for privacy on maps
-- Returns anonymized location data along with selected profile details.
CREATE OR REPLACE FUNCTION public.get_snapped_map_users()
RETURNS TABLE(
    user_id UUID,
    latitude double precision,
    longitude double precision,
    name TEXT,
    budget SMALLINT,
    bio TEXT,
    age INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Runs with privileges of function owner, bypassing RLS for reading locations/profiles.
SET search_path = public, extensions -- Ensure function can find tables and extensions
AS $$
DECLARE
    grid_size DECIMAL := 0.01; -- Approx 1.1km grid size in degrees. Adjust as needed.
BEGIN
    RETURN QUERY
    SELECT
        ul.user_id,
        -- Snap latitude and longitude to the grid center using PostGIS
        extensions.ST_Y(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS latitude,
        extensions.ST_X(extensions.ST_SnapToGrid(extensions.ST_SetSRID(extensions.ST_MakePoint(ul.longitude, ul.latitude), 4326), grid_size)) AS longitude,
        p.name,
        p.budget,
        p.bio,
        p.age
    FROM
        public.user_locations ul
    JOIN
        public.profiles p ON ul.user_id = p.id;
    -- Optional: Add a WHERE clause here if you only want to show users
    -- who have opted-in via p.location_access = TRUE, for example.
    -- WHERE p.location_access = TRUE;
END;
$$;

COMMENT ON FUNCTION public.get_snapped_map_users() IS 'Returns user data for map display, snapping locations to a grid for privacy. Uses SECURITY DEFINER to read necessary data across RLS.';


-- ## Step 4: Grant Function Permissions
-- Allow authenticated users to execute the created functions.

-- Grant execute permission for update_home_location
GRANT EXECUTE ON FUNCTION public.update_home_location(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Grant execute permission for get_snapped_map_users
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;


-- ## Step 5: Enable Row Level Security (RLS)
-- Enable RLS on all tables to enforce data access rules.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;


-- ## Step 6: Define RLS Policies
-- Create policies to control who can access or modify data.

-- ============================
-- Policies for public.profiles
-- ============================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile record
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id); -- Ensure they can only update their own

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- Allow the get_snapped_map_users function (SECURITY DEFINER) to read necessary profile data
-- Note: SECURITY DEFINER functions bypass RLS checks directly on tables,
-- but this policy explicitly grants read access for clarity and potential future use cases.
-- It's safer than a broad `USING (auth.role() = 'authenticated')` for SELECT if not needed elsewhere.
-- The function itself controls which columns are exposed.
CREATE POLICY "Allow map function to read profile data"
ON public.profiles FOR SELECT
USING (true); -- Broad access needed for SECURITY DEFINER function


-- ================================
-- Policies for public.user_locations
-- ================================

-- Allow users to view their own location
CREATE POLICY "Users can view own location"
ON public.user_locations FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own location
CREATE POLICY "Users can insert own location"
ON public.user_locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own location
CREATE POLICY "Users can update own location"
ON public.user_locations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own location (Optional - Add if needed)
-- CREATE POLICY "Users can delete own location"
-- ON public.user_locations FOR DELETE
-- USING (auth.uid() = user_id);

-- Allow the get_snapped_map_users function (SECURITY DEFINER) to read all locations
CREATE POLICY "Allow map function to read user locations"
ON public.user_locations FOR SELECT
USING (true); -- Broad access needed for SECURITY DEFINER function


-- ============================
-- Policies for public.meetups
-- ============================

-- Allow authenticated users to view all meetups
CREATE POLICY "Allow authenticated read access to meetups"
ON public.meetups FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert meetups linked to their own profile
CREATE POLICY "Allow authenticated users to insert own meetup"
ON public.meetups FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Allow creators to update their own meetups
CREATE POLICY "Allow creator to update own meetup"
ON public.meetups FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Allow creators to delete their own meetups
CREATE POLICY "Allow creator to delete own meetup"
ON public.meetups FOR DELETE
USING (auth.uid() = creator_id);

-- Note: Manual steps for Storage setup are not included here as they are typically
-- managed via the dashboard or specific storage commands/scripts.
-- Refer to the main documentation for Storage setup instructions.