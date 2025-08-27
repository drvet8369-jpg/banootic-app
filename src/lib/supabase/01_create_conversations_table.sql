
-- Step 1: Create the conversations table
-- This table will store a record for each unique chat session between two users.

CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_one_id uuid NOT NULL,
    participant_two_id uuid NOT NULL,
    last_message_id integer,
    last_message_at timestamp with time zone,

    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_participant_one_id_fkey FOREIGN KEY (participant_one_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT conversations_participant_two_id_fkey FOREIGN KEY (participant_two_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_conversation UNIQUE (participant_one_id, participant_two_id)
);

-- Step 2: Enable Row Level Security (RLS) on the new table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies for the conversations table
-- Users should only be able to see conversations they are a part of.

-- Policy for SELECT: Allows a user to see a conversation if their ID matches either participant.
CREATE POLICY "Users can view their own conversations."
ON public.conversations
FOR SELECT
USING (auth.uid() IN (participant_one_id, participant_two_id));

-- Policy for INSERT: Allows a user to create a conversation if they are one of the participants.
CREATE POLICY "Users can create conversations they are a part of."
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IN (participant_one_id, participant_two_id));

-- Policy for UPDATE: Allows a user to update a conversation (e.g., last message) if they are a participant.
CREATE POLICY "Users can update their own conversations."
ON public.conversations
FOR UPDATE
USING (auth.uid() IN (participant_one_id, participant_two_id));
