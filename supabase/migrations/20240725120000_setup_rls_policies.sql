
-- 1. Enable RLS for all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- PROVIDERS
DROP POLICY IF EXISTS "Providers are viewable by everyone." ON public.providers;
DROP POLICY IF EXISTS "Allow authorized user to insert provider profile" ON public.providers;
DROP POLICY IF EXISTS "Allow authorized user to update provider profile" ON public.providers;

-- REVIEWS
DROP POLICY IF EXISTS "Reviews are public." ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.reviews;

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations." ON public.conversations;


-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.messages;


-- AGREEMENTS
DROP POLICY IF EXISTS "Users can view their own agreements." ON public.agreements;
DROP POLICY IF EXISTS "Customers can create agreements." ON public.agreements;
DROP POLICY IF EXISTS "Providers can update their agreements." ON public.agreements;
DROP POLICY IF EXISTS "Agreements cannot be deleted." ON public.agreements;


-- 3. Create new, comprehensive policies

-- ============================
-- Table: profiles
-- ============================
-- Anyone can view public profile information.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- A user can create/update their own profile. Supabase handles INSERT on signup, we handle UPDATE.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ============================
-- Table: providers
-- ============================
-- Anyone can view provider information.
CREATE POLICY "Providers are viewable by everyone."
ON public.providers FOR SELECT
USING (true);

-- A user can insert a provider profile for themselves.
CREATE POLICY "Allow authorized user to insert provider profile"
ON public.providers FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- A user can update their own provider profile.
CREATE POLICY "Allow authorized user to update provider profile"
ON public.providers FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);


-- ============================
-- Table: reviews
-- ============================
-- Anyone can view reviews.
CREATE POLICY "Reviews are public."
ON public.reviews FOR SELECT
USING (true);

-- Logged-in users can insert reviews for themselves.
CREATE POLICY "Users can insert their own reviews."
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Users can update their own reviews.
CREATE POLICY "Users can update their own reviews."
ON public.reviews FOR UPDATE
USING (auth.uid() = author_id);

-- Users can delete their own reviews.
CREATE POLICY "Users can delete their own reviews."
ON public.reviews FOR DELETE
USING (auth.uid() = author_id);


-- ============================
-- Table: conversations
-- ============================
-- Users can only see conversations they are part of.
CREATE POLICY "Users can view their own conversations."
ON public.conversations FOR SELECT
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Users can create conversations they are part of (handled by RPC, but policy adds security).
CREATE POLICY "Users can create conversations."
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);


-- ============================
-- Table: messages
-- ============================
-- Users can only see messages in conversations they are a part of.
CREATE POLICY "Users can view messages in their conversations."
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
  )
);

-- Users can only send messages as themselves.
CREATE POLICY "Users can insert their own messages."
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can only update their own messages.
CREATE POLICY "Users can update their own messages."
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- ============================
-- Table: agreements
-- ============================
-- Users can only see agreements they are part of.
CREATE POLICY "Users can view their own agreements."
ON public.agreements FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Customers can create agreements for themselves.
CREATE POLICY "Customers can create agreements."
ON public.agreements FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Providers can update the status of their agreements.
CREATE POLICY "Providers can update their agreements."
ON public.agreements FOR UPDATE
USING (auth.uid() = provider_id);

-- Nobody can delete agreements to keep a historical record.
CREATE POLICY "Agreements cannot be deleted."
ON public.agreements FOR DELETE
USING (false);
