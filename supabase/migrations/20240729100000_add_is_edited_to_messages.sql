-- Add the 'is_edited' column to the 'messages' table to track edited messages.
ALTER TABLE public.messages
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

-- This command notifies PostgREST to reload its schema cache immediately,
-- preventing "column not found" errors after a migration.
NOTIFY pgrst, 'reload schema';
