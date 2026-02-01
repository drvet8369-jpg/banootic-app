-- Add the is_edited column to the messages table to track edited messages.
ALTER TABLE public.messages
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
