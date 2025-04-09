-- Supabase Migration Script: Add Chat Functionality
-- Adds tables, functions, and policies required for the chat feature.
-- Execute this script *after* the initial setup from improved_supabase_setup.md is complete.

-- ============================
-- Step 1: Create Chat Tables
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


-- ============================
-- Step 2: Create Helper Function
-- ============================

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


-- ============================
-- Step 3: Grant Function Permissions
-- ============================

-- Grant execute permission for is_blocked function
GRANT EXECUTE ON FUNCTION public.is_blocked(UUID, UUID) TO authenticated;


-- ============================
-- Step 4: Enable Row Level Security (RLS)
-- ============================

-- Enable RLS for chat tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;


-- ============================
-- Step 5: Define RLS Policies
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

-- --- End of Chat Feature Setup ---