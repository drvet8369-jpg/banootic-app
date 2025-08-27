
-- Step 1: Remove the old 'chat_id' text column
-- This column is being replaced by a more robust foreign key reference.
ALTER TABLE public.messages DROP COLUMN IF EXISTS chat_id;

-- Step 2: Add the new 'conversation_id' column
-- This column will link each message to a specific conversation in the new table.
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- Step 3: Create the foreign key constraint
-- This ensures data integrity between messages and conversations.
-- It also sets up cascading deletes, so if a conversation is deleted, all its messages are also deleted.
ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Step 4: Add an index on the new column for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Step 5: Update the existing RLS policies for the 'messages' table
-- We need to ensure that users can only select/insert messages for conversations they are part of.

-- Drop existing policies to replace them with the new logic.
DROP POLICY IF EXISTS "Users can view their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages." ON public.messages;

-- New SELECT Policy: A user can read a message if they are a participant in the conversation it belongs to.
CREATE POLICY "Users can view their own messages."
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = messages.conversation_id AND auth.uid() IN (participant_one_id, participant_two_id)
  )
);

-- New INSERT Policy: A user can insert a message if they are the sender AND a participant in the conversation.
CREATE POLICY "Users can insert their own messages."
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = messages.conversation_id AND auth.uid() IN (participant_one_id, participant_two_id)
  )
);
