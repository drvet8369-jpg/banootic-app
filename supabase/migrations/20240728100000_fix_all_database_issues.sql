-- =========== Final App Features Migration ===========
-- This script FIXES all database issues by dropping old functions
-- before recreating them, and ensuring all columns and policies are correct.
-- It is safe to run this script multiple times.

BEGIN;

-- Step 1: Drop potentially conflicting old functions first.
-- This resolves the "cannot change return type" error.
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid);
DROP FUNCTION IF EXISTS public.increment_agreements(uuid);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(uuid, uuid);

-- Step 2: Ensure all necessary columns exist.
-- Using ADD COLUMN IF NOT EXISTS is safe and idempotent.
ALTER TABLE public.agreements ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS agreements_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.messages ALTER COLUMN content TYPE TEXT;

-- Step 3: Recreate all functions with the correct definitions.

-- Function to increment agreements count on the providers table
CREATE OR REPLACE FUNCTION public.increment_agreements(provider_profile_id_in UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.providers
  SET agreements_count = agreements_count + 1
  WHERE profile_id = provider_profile_id_in;
END;
$$ LANGUAGE plpgsql;

-- Function to find an existing conversation or create a new one
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


-- Function to get all user conversations with details about the other participant and unread message count
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
    SELECT
      c.id,
      c.created_at,
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
    SELECT
      conversation_id,
      MAX(created_at) AS last_message_at
    FROM public.messages
    GROUP BY conversation_id
  )
  SELECT
    uc.id,
    uc.created_at,
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

-- Function to mark messages in a conversation as read for a specific user
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

-- Step 4: Re-apply Row Level Security (RLS) policies for all tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts before recreating them
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

-- Recreate all policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Providers are viewable by everyone." ON public.providers FOR SELECT USING (true);
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own reviews." ON public.reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Agreements are visible to participants." ON public.agreements FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = provider_id);
CREATE POLICY "Customers can create agreements." ON public.agreements FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update agreements." ON public.agreements FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Conversations are visible to participants." ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);
CREATE POLICY "Messages are visible to participants." ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert their own messages." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

COMMIT;
