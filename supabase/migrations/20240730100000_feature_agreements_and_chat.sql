-- Migration to add status to agreements and implement full chat/inbox functionality.

-- Add a 'status' column to the 'agreements' table.
-- This allows tracking whether an agreement is pending, accepted, or rejected.
CREATE TYPE public.agreement_status AS ENUM ('pending', 'accepted', 'rejected');

ALTER TABLE public.agreements
ADD COLUMN status public.agreement_status NOT NULL DEFAULT 'pending';

-- Add an 'agreements_count' column to the 'providers' table for quick lookup.
ALTER TABLE public.providers
ADD COLUMN agreements_count integer NOT NULL DEFAULT 0;

-- Create an RPC function to safely increment the agreements count on the providers table.
-- This is called when a provider accepts an agreement.
CREATE OR REPLACE FUNCTION public.increment_agreements(provider_profile_id_in uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.providers
  SET agreements_count = agreements_count + 1
  WHERE profile_id = provider_profile_id_in;
END;
$$;

-- Add a 'last_message_at' column to the conversations table for sorting the inbox.
ALTER TABLE public.conversations
ADD COLUMN last_message_at timestamptz DEFAULT now() NOT NULL;

-- Create a function that will be triggered to update the 'last_message_at' timestamp.
CREATE OR REPLACE FUNCTION public.update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls the function after a new message is inserted.
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_message_at();

-- Add an 'is_read' column to the messages table to track unread messages.
ALTER TABLE public.messages
ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Create an RPC function to get all conversations for a user, including details
-- for the other participant, the last message, and the count of unread messages.
-- This powers the main inbox view.
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_unread(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  participant_one_id uuid,
  participant_two_id uuid,
  last_message_content text,
  last_message_at timestamptz,
  other_participant jsonb,
  unread_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH last_messages AS (
    SELECT
      conversation_id,
      MAX(created_at) as last_message_time
    FROM messages
    WHERE conversation_id IN (SELECT c.id FROM conversations c WHERE c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id)
    GROUP BY conversation_id
  )
  SELECT
    c.id,
    c.created_at,
    c.participant_one_id,
    c.participant_two_id,
    m.content AS last_message_content,
    c.last_message_at,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    (SELECT COUNT(*) FROM messages msg WHERE msg.conversation_id = c.id AND msg.receiver_id = p_user_id AND msg.is_read = false) as unread_count
  FROM
    conversations c
  JOIN
    profiles p ON p.id = (
      CASE
        WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
        ELSE c.participant_one_id
      END
    )
  LEFT JOIN
    last_messages lm ON lm.conversation_id = c.id
  LEFT JOIN
    messages m ON m.conversation_id = lm.conversation_id AND m.created_at = lm.last_message_time
  WHERE
    (c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id)
  ORDER BY
    c.last_message_at DESC;
END;
$$;


-- Create an RPC function to either find an existing conversation between two users
-- or create a new one if it doesn't exist. This prevents duplicate conversations.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_one uuid, p_two uuid)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    participant_one_id uuid,
    participant_two_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Ensure consistent order of participants to prevent duplicates like (A,B) and (B,A).
    IF p_one < p_two THEN
        SELECT c.id INTO v_conversation_id
        FROM conversations c
        WHERE c.participant_one_id = p_one AND c.participant_two_id = p_two;
    ELSE
        SELECT c.id INTO v_conversation_id
        FROM conversations c
        WHERE c.participant_one_id = p_two AND c.participant_two_id = p_one;
    END IF;

    IF v_conversation_id IS NULL THEN
        -- Conversation does not exist, create it.
        INSERT INTO conversations (participant_one_id, participant_two_id)
        VALUES (
            CASE WHEN p_one < p_two THEN p_one ELSE p_two END,
            CASE WHEN p_one < p_two THEN p_two ELSE p_one END
        )
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    RETURN QUERY
    SELECT c.id, c.created_at, c.participant_one_id, c.participant_two_id
    FROM conversations c
    WHERE c.id = v_conversation_id;
END;
$$;

-- Create a function to mark all unread messages in a conversation for a specific user as read.
-- This is called when a user opens a chat.
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id AND receiver_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
