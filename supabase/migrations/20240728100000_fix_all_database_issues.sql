-- =========== Final & Definitive Database Cleanup & Fix ===========
-- This script performs a "scorched earth" cleanup by dropping ALL possible
-- versions of the problematic functions before creating the single, correct version.
-- It also includes all previous necessary schema changes.

BEGIN;

-- 1. Add `status` column to `agreements` table if it doesn't exist
ALTER TABLE public.agreements ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 2. Add `agreements_count` column to `providers` table if it doesn't exist
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS agreements_count INTEGER NOT NULL DEFAULT 0;

-- 3. Add `is_read` column to `messages` table if it doesn't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure content column is text
ALTER TABLE public.messages ALTER COLUMN content TYPE TEXT;

-- 4. Drop ALL possible old/faulty functions to ensure a clean state
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(); -- Drop parameter-less version
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid); -- Drop parameterized version
DROP FUNCTION IF EXISTS public.get_total_unread_message_count(); -- Drop parameter-less version
DROP FUNCTION IF EXISTS public.get_total_unread_message_count(uuid); -- Drop parameterized version
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS public.increment_agreements(uuid);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(uuid, uuid);

-- 5. Create/Recreate all functions from scratch with the correct and final logic

-- Function to increment agreements
CREATE OR REPLACE FUNCTION public.increment_agreements(provider_profile_id_in UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.providers
  SET agreements_count = agreements_count + 1
  WHERE profile_id = provider_profile_id_in;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a conversation
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

-- Function to mark messages as read
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

-- Efficient function for counting total unread messages
CREATE OR REPLACE FUNCTION public.get_total_unread_message_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    total_unread BIGINT;
BEGIN
    SELECT count(*)
    INTO total_unread
    FROM public.messages msg
    WHERE msg.receiver_id = p_user_id AND msg.is_read = FALSE;

    RETURN total_unread;
END;
$$ LANGUAGE plpgsql;

-- Final, rewritten inbox function using LATERAL JOIN
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
  SELECT
    c.id,
    c.created_at,
    c.participant_one_id,
    c.participant_two_id,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    last_msg.content,
    last_msg.created_at AS last_message_at,
    (SELECT count(*) FROM public.messages msg WHERE msg.conversation_id = c.id AND msg.receiver_id = p_user_id AND msg.is_read = FALSE) AS unread_count
  FROM
    public.conversations c
  JOIN public.profiles p ON p.id = (
    CASE
      WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
      ELSE c.participant_one_id
    END
  )
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM public.messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  WHERE
    c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id
  ORDER BY
    last_msg.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;


-- 6. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies to prevent conflicts, then (re)create them
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
