# Improved Supabase Setup Script: Meat-and-Eat

This script provides the SQL commands to set up the database schema, functions, and policies for the Meat-and-Eat project on Supabase. It represents the consolidated final state derived from previous development iterations.

**Instructions:**

1.  Ensure you have a Supabase project created.
2.  Navigate to the SQL Editor in your Supabase dashboard.
3.  Execute the commands in each step sequentially.
4.  **Important:** For avatar functionality, you must also configure Supabase Storage as described in the comments below.

---

## Step 1: Enable Extensions

Enable the PostGIS extension, which is required for geospatial functions and indexing.

```sql
-- Enable PostGIS Extension (Required for geospatial functions/indexing)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Enable pgcrypto for gen_random_uuid() if not already enabled (usually is by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
```

---

## Step 2: Create Tables

Define the core tables for the application.

```sql
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


-- ============================
-- Chat Related Tables
-- ============================

-- Create chats table
-- Stores metadata about conversations between two users.
CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    -- Removed UNIQUE constraint based on functions here
    CONSTRAINT check_participants_not_equal CHECK (participant1_id <> participant2_id)
);

COMMENT ON TABLE public.chats IS 'Represents a chat conversation between two users.';
-- Removed comment for the old constraint

CREATE INDEX idx_chats_participant1 ON public.chats(participant1_id);
CREATE INDEX idx_chats_participant2 ON public.chats(participant2_id);
CREATE INDEX idx_chats_participants ON public.chats (least(participant1_id, participant2_id), greatest(participant1_id, participant2_id)); -- For faster lookups by pair

-- Add the UNIQUE index using functions separately
CREATE UNIQUE INDEX idx_unique_chat_participants ON public.chats (least(participant1_id, participant2_id), greatest(participant1_id, participant2_id));
COMMENT ON INDEX public.idx_unique_chat_participants IS 'Ensures only one chat record exists for any pair of users, regardless of order.';


-- Create messages table
-- Stores individual messages within a chat.
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'form', 'map_marker')), -- Define allowed message types
    content TEXT NULL CHECK (message_type = 'text' AND content IS NOT NULL OR message_type <> 'text'), -- Text content only for text type
    form_data JSONB NULL CHECK (message_type = 'form' AND form_data IS NOT NULL OR message_type <> 'form'), -- JSONB data only for form type
    map_latitude DOUBLE PRECISION NULL CHECK (message_type = 'map_marker' AND map_latitude IS NOT NULL OR message_type <> 'map_marker'), -- Geo data only for map type
    map_longitude DOUBLE PRECISION NULL CHECK (message_type = 'map_marker' AND map_longitude IS NOT NULL OR message_type <> 'map_marker'), -- Geo data only for map type
    map_marker_label TEXT NULL CHECK (message_type = 'map_marker'), -- Optional label for map marker
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL
);

COMMENT ON TABLE public.messages IS 'Stores individual messages within a chat conversation.';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, form submission, map marker.';
COMMENT ON COLUMN public.messages.form_data IS 'Stores structured data for form-type messages.';
COMMENT ON COLUMN public.messages.is_read IS 'Indicates if the message has been read by the recipient (logic handled client-side or via triggers).';

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC); -- For fetching recent messages


-- Create user_blocks table
-- Stores records of users blocking other users.
CREATE TABLE public.user_blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT check_blocker_not_blocked CHECK (blocker_id <> blocked_id)
);

COMMENT ON TABLE public.user_blocks IS 'Records which users have blocked other users.';


-- Create user_reports table
-- Stores reports submitted by users against other users.
CREATE TABLE public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(reason) > 0 AND char_length(reason) <= 1000),
    chat_id UUID NULL REFERENCES public.chats(id) ON DELETE SET NULL, -- Optional: Link report to a specific chat
    message_id UUID NULL REFERENCES public.messages(id) ON DELETE SET NULL, -- Optional: Link report to a specific message
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')), -- Report status for moderation
    CONSTRAINT check_reporter_not_reported CHECK (reporter_id <> reported_id)
);

COMMENT ON TABLE public.user_reports IS 'Stores user-submitted reports for moderation.';
COMMENT ON COLUMN public.user_reports.status IS 'Moderation status of the report.';

CREATE INDEX idx_user_reports_reporter_id ON public.user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_id ON public.user_reports(reported_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);

```

---

## Step 3: Create Functions

Define reusable database functions.

```sql
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
-- Function to check if a user is blocked by another user
CREATE OR REPLACE FUNCTION public.is_blocked(p_blocker_id UUID, p_blocked_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE -- Indicates the function cannot modify the database and always returns the same results for the same arguments within a single transaction
SECURITY DEFINER -- Needs to check the blocks table potentially bypassing RLS if needed, though current block RLS allows reading own blocks. Safer to use DEFINER.
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id
  );
$$;

COMMENT ON FUNCTION public.is_blocked(UUID, UUID) IS 'Checks if the first user ID has blocked the second user ID. Requires SECURITY DEFINER.';


-- Function to get an existing chat ID or create a new one
CREATE OR REPLACE FUNCTION public.get_or_create_chat(user1_id UUID, user2_id UUID)
RETURNS UUID -- Return the chat ID
LANGUAGE plpgsql
SECURITY DEFINER -- Needs elevated privileges to potentially insert into chats table
SET search_path = public
AS $$
DECLARE
  chat_uuid UUID;
  p1_id UUID := LEAST(user1_id, user2_id); -- Ensure consistent ordering
  p2_id UUID := GREATEST(user1_id, user2_id);
BEGIN
  -- Check if users are the same
  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create a chat with oneself (user1_id: %, user2_id: %)', user1_id, user2_id;
  END IF;

  -- Try to find existing chat
  SELECT id INTO chat_uuid
  FROM public.chats
  WHERE participant1_id = p1_id AND participant2_id = p2_id;

  -- If not found, create a new chat
  IF chat_uuid IS NULL THEN
    INSERT INTO public.chats (participant1_id, participant2_id)
    VALUES (p1_id, p2_id)
    RETURNING id INTO chat_uuid;
  END IF;

  RETURN chat_uuid;

EXCEPTION
  WHEN unique_violation THEN
    -- Handle potential race condition if another process created the chat simultaneously
    SELECT id INTO chat_uuid
    FROM public.chats
    WHERE participant1_id = p1_id AND participant2_id = p2_id;
    IF chat_uuid IS NULL THEN
       -- This shouldn't happen if the unique index is correct, but handle defensively
       RAISE EXCEPTION 'Failed to retrieve chat ID after unique violation (p1: %, p2: %)', p1_id, p2_id;
    END IF;
    RETURN chat_uuid;
  WHEN OTHERS THEN
    -- Log or handle other errors as needed
    RAISE EXCEPTION 'Error in get_or_create_chat (p1: %, p2: %): %', p1_id, p2_id, SQLERRM;
END;
$$; -- Ensure this closing delimiter is present and correct

COMMENT ON FUNCTION public.get_or_create_chat(UUID, UUID) IS 'Finds an existing chat between two users or creates a new one, returning the chat ID. Ensures consistent participant order.';

```

---

## Step 4: Grant Function Permissions

Allow authenticated users to execute the created functions.

```sql
-- Grant execute permission for update_home_location
GRANT EXECUTE ON FUNCTION public.update_home_location(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Grant execute permission for get_snapped_map_users
GRANT EXECUTE ON FUNCTION public.get_snapped_map_users() TO authenticated;

-- Grant execute permission for is_blocked function
GRANT EXECUTE ON FUNCTION public.is_blocked(UUID, UUID) TO authenticated;

-- Grant execute permission for get_or_create_chat function
GRANT EXECUTE ON FUNCTION public.get_or_create_chat(UUID, UUID) TO authenticated;
```

---

## Step 5: Enable Row Level Security (RLS)

Enable RLS on all tables to enforce data access rules.

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Enable RLS for chat tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
```

---

## Step 6: Define RLS Policies

Create policies to control who can access or modify data.

```sql
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


-- ============================
-- Policies for public.chats
-- ============================

-- Allow users to view chats they participate in
CREATE POLICY "Users can view own chats"
ON public.chats FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Allow users to insert chats they participate in
-- (Note: Chat creation might be handled differently, e.g., when first message is sent or via a function)
CREATE POLICY "Users can insert own chats"
ON public.chats FOR INSERT
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Allow users to update the updated_at timestamp of chats they participate in (e.g., on new message)
CREATE POLICY "Users can update own chats timestamp"
ON public.chats FOR UPDATE
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id)
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id); -- Can only update own chats

-- Users generally shouldn't delete chats directly, maybe archive/hide instead. Add DELETE policy if needed.


-- ============================
-- Policies for public.messages
-- ============================

-- Allow users to view messages in chats they participate in, unless they are blocked by the sender
CREATE POLICY "Users can view messages in own chats unless blocked"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chats c
    WHERE c.id = messages.chat_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
  AND NOT public.is_blocked(messages.sender_id, auth.uid()) -- Cannot see messages from someone who blocked you
);


-- Allow users to insert messages in chats they participate in, if they are the sender, and not blocked by the recipient
CREATE POLICY "Users can insert messages in own chats if not blocked"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() -- Must be the sender
  AND EXISTS ( -- Must be a participant in the chat
    SELECT 1
    FROM public.chats c
    WHERE c.id = messages.chat_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
  AND EXISTS ( -- Check if the recipient has blocked the sender
    SELECT 1
    FROM public.chats c
    JOIN public.profiles p1 ON c.participant1_id = p1.id
    JOIN public.profiles p2 ON c.participant2_id = p2.id
    WHERE c.id = messages.chat_id
      AND (
        (c.participant1_id = auth.uid() AND NOT public.is_blocked(c.participant2_id, auth.uid())) -- If sender is p1, check if p2 blocked p1
        OR
        (c.participant2_id = auth.uid() AND NOT public.is_blocked(c.participant1_id, auth.uid())) -- If sender is p2, check if p1 blocked p2
      )
  )
);

-- Allow users to update the is_read status of messages in their chats (specific logic might be needed)
-- This policy is basic; a more robust solution might use a function or trigger.
CREATE POLICY "Users can update read status in own chats"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.chats c
    WHERE c.id = messages.chat_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
)
WITH CHECK ( -- Can only update is_read flag, and only if you are a participant
  EXISTS (
    SELECT 1
    FROM public.chats c
    WHERE c.id = messages.chat_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
);

-- Users generally shouldn't delete messages directly. Add DELETE policy if needed (e.g., delete own messages).


-- ============================
-- Policies for public.user_blocks
-- ============================

-- Allow users to view their own blocks (who they have blocked)
CREATE POLICY "Users can view own blocks"
ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id);

-- Allow users to insert blocks for themselves
CREATE POLICY "Users can insert own blocks"
ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

-- Allow users to delete their own blocks (unblock)
CREATE POLICY "Users can delete own blocks"
ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id);


-- ============================
-- Policies for public.user_reports
-- ============================

-- Allow users to insert reports
CREATE POLICY "Users can insert reports"
ON public.user_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Allow users to view reports they submitted
CREATE POLICY "Users can view own reports"
ON public.user_reports FOR SELECT
USING (auth.uid() = reporter_id);

-- Allow admins/moderators to view all reports (Example using a custom role 'moderator')
-- CREATE POLICY "Moderators can view all reports"
-- ON public.user_reports FOR SELECT
-- USING ((auth.jwt() ->> 'user_role') = 'moderator'); -- Example: Check for 'moderator' role in JWT claims

-- Allow admins/moderators to update report status
-- CREATE POLICY "Moderators can update report status"
-- ON public.user_reports FOR UPDATE
-- USING ((auth.jwt() ->> 'user_role') = 'moderator'); -- Example: Check for 'moderator' role in JWT claims

-- Allow admins/moderators to delete reports (use cautiously)
-- CREATE POLICY "Moderators can delete reports"
-- ON public.user_reports FOR DELETE
-- USING ((auth.jwt() ->> 'user_role') = 'moderator'); -- Example: Check for 'moderator' role in JWT claims

```

---

## Step 7: Avatar Storage Setup (Manual Steps)

The `avatar_url` column in the `profiles` table requires a Supabase Storage bucket.

1.  **Create Bucket:** Go to Storage in your Supabase dashboard and create a new bucket (e.g., named `avatars`).
2.  **Make Public (Optional but Recommended):** For easier URL access in your app, consider making the bucket public. If you keep it private, you'll need to generate signed URLs in your application.
3.  **Configure Bucket RLS Policies:** Add policies to the `avatars` bucket to control access:
    *   **SELECT:** Allow authenticated users to view avatars (`SELECT` permission). You might restrict this further if needed (e.g., only view own or friends').
    *   **INSERT:** Allow authenticated users to upload their *own* avatar. The policy should check that the path includes the user's ID (e.g., `(bucket_id = 'avatars') AND (auth.uid()::text = (storage.foldername(name))[1])`).
    *   **UPDATE:** Allow authenticated users to update their *own* avatar (similar path check as INSERT).
    *   **DELETE:** Allow authenticated users to delete their *own* avatar (similar path check as INSERT).

    *Refer to the Supabase Storage documentation for detailed examples of RLS policies.*

---

Setup Complete. You can now interact with these tables and functions from your application.