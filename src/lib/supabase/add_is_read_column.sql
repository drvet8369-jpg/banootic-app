-- Add the is_read column to the messages table to track read status.
-- This is a non-destructive operation that adds a new column with a default value.
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
