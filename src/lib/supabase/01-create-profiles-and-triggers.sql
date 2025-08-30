
-- Drop the trigger and function if they exist to ensure a clean re-creation.
-- This prevents errors if the script is run multiple times.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.create_public_profile_for_user;

-- Function to create a user profile in public.users when a new user signs up.
create function public.create_public_profile_for_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, account_type, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'account_type')::account_type,
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Trigger to call the function after a new user is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_public_profile_for_user();

-- Enable RLS for the tables
alter table public.users enable row level security;
alter table public.providers enable row level security;
alter table public.customers enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.agreements enable row level security;

-- Policies for 'users' table
-- Users can see their own profile.
create policy "Users can view their own profile."
on public.users for select
using ( auth.uid() = id );

-- Users can update their own profile.
create policy "Users can update their own profile."
on public.users for update
using ( auth.uid() = id );


-- Policies for 'providers' table
-- Allow public read access to all providers.
create policy "Providers are publicly visible."
on public.providers for select
using ( true );

-- Allow providers to update their own profile.
create policy "Providers can update their own profile."
on public.providers for update
using ( auth.uid() = user_id );


-- Policies for 'customers' table
-- Allow customers to view their own profile.
create policy "Customers can view their own profile."
on public.customers for select
using ( auth.uid() = user_id );

-- Allow customers to update their own profile.
create policy "Customers can update their own profile."
on public.customers for update
using ( auth.uid() = user_id );

-- Policies for 'messages' table
-- Allow users to see messages in conversations they are part of.
create policy "Users can view messages in their conversations."
on public.messages for select
using ( 
  auth.uid() = sender_id or auth.uid() = receiver_id 
);

-- Allow users to insert messages where they are the sender.
create policy "Users can send messages."
on public.messages for insert
with check ( auth.uid() = sender_id );

-- Allow users to update the is_read status of messages sent to them.
create policy "Users can mark their messages as read."
on public.messages for update
using ( auth.uid() = receiver_id )
with check ( auth.uid() = receiver_id );


-- Policies for 'conversations' table
-- Allow users to view conversations they are part of.
create policy "Users can view their own conversations."
on public.conversations for select
using (
  auth.uid() = participant_one_id or auth.uid() = participant_two_id
);

-- Note: Conversation creation/updates are handled by RPC functions.

-- This ensures that when a message is inserted, the last_message_at of the corresponding conversation is updated.
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();


-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMPTZ,
    participant_one_id UUID,
    participant_two_id UUID,
    last_message_at TIMESTAMPTZ
) AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Ensure order to prevent duplicate conversations
    IF p_user_id_1 < p_user_id_2 THEN
        SELECT c.id INTO v_conversation_id FROM conversations c WHERE c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2;
    ELSE
        SELECT c.id INTO v_conversation_id FROM conversations c WHERE c.participant_one_id = p_user_id_2 AND c.participant_two_id = p_user_id_1;
    END IF;

    IF v_conversation_id IS NULL THEN
        -- Create new conversation
        INSERT INTO conversations (participant_one_id, participant_two_id)
        VALUES (
            LEAST(p_user_id_1, p_user_id_2),
            GREATEST(p_user_id_1, p_user_id_2)
        )
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    RETURN QUERY SELECT * FROM conversations c WHERE c.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- Function to create a provider profile
CREATE OR REPLACE FUNCTION create_provider_profile(
    p_user_id UUID,
    p_name TEXT,
    p_service TEXT,
    p_location TEXT,
    p_phone TEXT,
    p_bio TEXT,
    p_category_slug TEXT,
    p_service_slug TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.providers(user_id, name, service, location, phone, bio, category_slug, service_slug)
    VALUES (p_user_id, p_name, p_service, p_location, p_phone, p_bio, p_category_slug, p_service_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get conversation metadata for a user
CREATE OR REPLACE FUNCTION get_conversations_metadata(user_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    last_message_content TEXT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.conversation_id IN (SELECT c.id FROM conversations c WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id)
    ),
    unread_counts AS (
        SELECT
            m.conversation_id,
            count(*) as unread
        FROM messages m
        WHERE m.receiver_id = user_id AND m.is_read = false
        GROUP BY m.conversation_id
    )
    SELECT
        c.id,
        lm.content,
        COALESCE(uc.unread, 0)
    FROM conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;
