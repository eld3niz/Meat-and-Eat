# Supabase SQL for Meetup Proposal Feature

This file contains the SQL commands needed to add the meetup proposal functionality to the Meat-and-Eat Supabase backend.

```sql
-- ================================
-- Meetup Proposals Table
-- ================================
-- Stores proposals sent between users for meetups.

CREATE TABLE public.meetup_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    place_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    meetup_time TIMESTAMPTZ NOT NULL,
    description TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    CONSTRAINT sender_recipient_check CHECK (sender_id <> recipient_id) -- Prevent users from sending proposals to themselves
);

COMMENT ON TABLE public.meetup_proposals IS 'Stores meetup proposals sent from one user (sender) to another (recipient).';
COMMENT ON COLUMN public.meetup_proposals.status IS 'Current status of the proposal: pending, accepted, declined, countered.';

-- Add indexes for faster querying by sender or recipient
CREATE INDEX idx_meetup_proposals_sender_id ON public.meetup_proposals(sender_id);
CREATE INDEX idx_meetup_proposals_recipient_id ON public.meetup_proposals(recipient_id);

-- Optional: Trigger to automatically update updated_at timestamp
-- Create the function if it doesn't exist (might be shared with other tables)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the new table
CREATE TRIGGER set_meetup_proposals_timestamp
BEFORE UPDATE ON public.meetup_proposals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable RLS for the new table
ALTER TABLE public.meetup_proposals ENABLE ROW LEVEL SECURITY;

-- =======================================
-- RLS Policies for public.meetup_proposals
-- =======================================

-- Allow users to view proposals they sent or received
CREATE POLICY "Allow users to view own proposals"
ON public.meetup_proposals FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Allow users to insert proposals where they are the sender
CREATE POLICY "Allow users to insert proposals as sender"
ON public.meetup_proposals FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Allow recipients to update the status of proposals sent to them
CREATE POLICY "Allow recipients to update proposal status"
ON public.meetup_proposals FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id); -- Check applies to the row being updated

-- Allow sender or recipient to delete proposals involving them (e.g., cancel pending, remove old)
CREATE POLICY "Allow involved users to delete proposals"
ON public.meetup_proposals FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);