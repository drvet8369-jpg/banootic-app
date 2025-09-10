-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    phone text UNIQUE,
    account_type text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own profile
CREATE POLICY "Allow users to read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own customer entry
CREATE POLICY "Allow users to view own customer entry" ON public.customers FOR SELECT USING (auth.uid() = user_id);

-- Create the providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text,
    phone text,
    service text,
    location text,
    bio text,
    category_slug text,
    service_slug text,
    rating double precision DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for the providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to providers
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);

-- Policy: Allow providers to update their own profile
CREATE POLICY "Allow provider to update own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for the reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);

-- Policy: Allow customers to insert their own reviews
CREATE POLICY "Allow customer to insert own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Create the agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigserial PRIMARY KEY,
    customer_phone text NOT NULL,
    provider_phone text NOT NULL,
    status text DEFAULT 'pending'::text,
    requested_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);

-- Enable RLS for the agreements table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Allow provider to see their agreements
CREATE POLICY "Allow provider to see their agreements" ON public.agreements FOR SELECT USING (EXISTS (SELECT 1 FROM public.providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone));

-- Policy: Allow customer to see their agreements
CREATE POLICY "Allow customer to see their agreements" ON public.agreements FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.phone = agreements.customer_phone));

-- Policy: Allow customer to create an agreement
CREATE POLICY "Allow customer to create an agreement" ON public.agreements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.phone = agreements.customer_phone));

-- Policy: Allow provider to update (confirm) an agreement
CREATE POLICY "Allow provider to update agreement" ON public.agreements FOR UPDATE USING (EXISTS (SELECT 1 FROM public.providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone));

-- Create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    participant_one_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at timestamp with time zone,
    UNIQUE (participant_one_id, participant_two_id)
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow participants to view their own conversations
CREATE POLICY "Allow participants to access their conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow participants to access messages in their conversations
CREATE POLICY "Allow participants to access messages" ON public.messages FOR SELECT USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id) AND
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE conversations.id = messages.conversation_id
    )
);

-- Policy: Allow users to send messages
CREATE POLICY "Allow users to send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy: Allow receiver to mark messages as read
CREATE POLICY "Allow receiver to update is_read" ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);
