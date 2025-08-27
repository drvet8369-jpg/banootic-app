-- This script adds the is_read column to the messages table.
-- Run this ONCE in your Supabase SQL Editor to update the table structure.

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Also, add an index for performance
CREATE INDEX IF NOT EXISTS messages_receiver_id_is_read_idx ON public.messages (receiver_id, is_read);
