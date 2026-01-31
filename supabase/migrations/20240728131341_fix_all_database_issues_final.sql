-- =========== Final App Features Migration ===========
-- This script sets up all necessary columns, functions, and policies.
-- It is idempotent and safe to run multiple times. It drops functions before creating them to avoid conflicts.

BEGIN;

-- 1. Add `status` column to `agreements` table if it doesn't exist
ALTER TABLE public.agreements ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 2. Add `agreements_count` column to `providers` table if it doesn't exist
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS agreements_count INTEGER NOT NULL DEFAULT 0;

-- 3. Add `is_read` column to `messages` table if it doesn't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure content column is text
ALTER TABLE public.messages ALTER COLUMN content TYPE TEXT;

-- 4. Create/Update RPC function to increment agreements
DROP FUNCTION IF EXISTS public.increment_agreements(uuid);
CREATE OR REPLACE FUNCTION public.increment_agreements(provider_profile_id_in UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.providers
  SET agreements_count = agreements_count + 1
  WHERE profile_id = provider_profile_id_in;
END;
$$ LANGUAGE plpgsql;

-- 5. Create/Update RPC function to get or create a conversation
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid);
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_one UUID, p_two UUID)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ, participant_one_id UUID, participant_two_id UUID) AS $$
DECLARE
    conversation_record RECORD;
BEGIN
    SELECT * INTO conversation_record
    FROM public.conversations
    WHERE (participant_one_id = p_one AND participant_two_id = p_two)
       OR (participant_one_id = p_two AND participant_two_id = p_one);

    IF NOT FOUND THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (p_one, p_two)
        RETURNING * INTO conversation_record;
    END IF;

    RETURN QUERY SELECT conversation_record.id, conversation_record.created_at, conversation_record.participant_one_id, conversation_record.participant_two_id;
END;
$$ LANGUAGE plpgsql;


-- 6. Create/Update RPC function to get conversations with unread counts (CORRECTED VERSION)
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid);
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_unread(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    participant_one_id UUID,
    participant_two_id UUID,
    other_participant JSON,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    -- Alias the 'created_at' column from the conversations table to avoid ambiguity
    SELECT
      c.id,
      c.created_at AS conversation_created_at, -- <<< FIX IS HERE
      c.participant_one_id,
      c.participant_two_id,
      CASE
        WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
        ELSE c.participant_one_id
      END AS other_participant_id
    FROM public.conversations c
    WHERE c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id
  ),
  latest_messages AS (
    -- Find the timestamp of the last message for each conversation
    SELECT
      conversation_id,
      MAX(created_at) AS last_message_at
    FROM public.messages
    GROUP BY conversation_id
  )
  -- Final SELECT statement joining all data together
  SELECT
    uc.id,
    uc.conversation_created_at AS created_at, -- <<< Use the ALIAS here
    uc.participant_one_id,
    uc.participant_two_id,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    m.content AS last_message_content,
    lm.last_message_at,
    (SELECT count(*) FROM public.messages msg WHERE msg.conversation_id = uc.id AND msg.receiver_id = p_user_id AND msg.is_read = FALSE) AS unread_count
  FROM user_conversations uc
  JOIN public.profiles p ON p.id = uc.other_participant_id
  LEFT JOIN latest_messages lm ON lm.conversation_id = uc.id
  LEFT JOIN public.messages m ON m.conversation_id = lm.conversation_id AND m.created_at = lm.last_message_at
  ORDER BY lm.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;


-- 7. Create/Update RPC function to mark messages as read
DROP FUNCTION IF EXISTS public.mark_messages_as_read(uuid, uuid);
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies to prevent conflicts, then (re)create them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Providers are viewable by everyone." ON public.providers;

DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews." ON public.reviews;

DROP POLICY IF EXISTS "Agreements are visible to participants." ON public.agreements;
DROP POLICY IF EXISTS "Customers can create agreements." ON public.agreements;
DROP POLICY IF EXISTS "Providers can update agreements." ON public.agreements;

DROP POLICY IF EXISTS "Conversations are visible to participants." ON public.conversations;

DROP POLICY IF EXISTS "Messages are visible to participants." ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages." ON public.messages;

-- Create policies for PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for PROVIDERS (read-only for users)
CREATE POLICY "Providers are viewable by everyone." ON public.providers FOR SELECT USING (true);

-- Create policies for REVIEWS
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own reviews." ON public.reviews FOR UPDATE USING (auth.uid() = author_id);

-- Create policies for AGREEMENTS
CREATE POLICY "Agreements are visible to participants." ON public.agreements FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);
CREATE POLICY "Customers can create agreements." ON public.agreements FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update agreements." ON public.agreements FOR UPDATE USING (auth.uid() = provider_id);

-- Create policies for CONVERSATIONS
CREATE POLICY "Conversations are visible to participants." ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Create policies for MESSAGES
CREATE POLICY "Messages are visible to participants." ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert their own messages." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);


COMMIT;
