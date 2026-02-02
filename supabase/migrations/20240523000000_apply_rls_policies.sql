-- =============================================
-- RLS POLICIES FOR BANOUTIQUE APP
-- THIS SCRIPT APPLIES ROW-LEVEL SECURITY TO ALL SENSITIVE TABLES.
-- =============================================

-- ---------------------------------------------
-- TABLE: profiles
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 3. Create new policies
-- POLICY: Allow authenticated users to read all profiles (for listing providers, etc.)
CREATE POLICY "Authenticated users can view all profiles."
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- POLICY: Allow users to update only their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ---------------------------------------------
-- TABLE: providers
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Providers are viewable by everyone." ON public.providers;
DROP POLICY IF EXISTS "Users can update their own provider info." ON public.providers;

-- 3. Create new policies
-- POLICY: Anyone can read provider information (it's a public marketplace).
CREATE POLICY "Providers are viewable by everyone."
ON public.providers FOR SELECT
USING (true);

-- POLICY: A user can only update their own provider entry.
CREATE POLICY "Users can update their own provider info."
ON public.providers FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);


-- ---------------------------------------------
-- TABLE: reviews
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.reviews;

-- 3. Create new policies
-- POLICY: Anyone can read reviews.
CREATE POLICY "Reviews are viewable by everyone."
ON public.reviews FOR SELECT
USING (true);

-- POLICY: Authenticated users can insert reviews.
CREATE POLICY "Users can insert their own reviews."
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- POLICY: Users can only update their own reviews.
CREATE POLICY "Users can update their own reviews."
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- POLICY: Users can only delete their own reviews.
CREATE POLICY "Users can delete their own reviews."
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = author_id);


-- ---------------------------------------------
-- TABLE: conversations
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can only view their own conversations." ON public.conversations;
DROP POLICY IF EXISTS "Users can only create conversations they are a part of." ON public.conversations;

-- 3. Create new policies
-- POLICY: A user can only see a conversation if they are one of the participants.
CREATE POLICY "Users can only view their own conversations."
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- POLICY: A user can only create a conversation if they are one of the participants.
CREATE POLICY "Users can only create conversations they are a part of."
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);


-- ---------------------------------------------
-- TABLE: messages
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can only view messages in their conversations." ON public.messages;
DROP POLICY IF EXISTS "Users can only send messages as themselves." ON public.messages;
DROP POLICY IF EXISTS "Users can only edit their own messages." ON public.messages;

-- 3. Create new policies
-- POLICY: Users can only see messages belonging to a conversation they are part of.
CREATE POLICY "Users can only view messages in their conversations."
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())
  )
);

-- POLICY: Users can only insert messages where they are the sender.
CREATE POLICY "Users can only send messages as themselves."
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- POLICY: Users can only update their own messages.
CREATE POLICY "Users can only edit their own messages."
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);


-- ---------------------------------------------
-- TABLE: agreements
-- ---------------------------------------------
-- 1. Enable RLS
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can only view their own agreements." ON public.agreements;
DROP POLICY IF EXISTS "Customers can create their own agreements." ON public.agreements;
DROP POLICY IF EXISTS "Providers can update agreements for them." ON public.agreements;

-- 3. Create new policies
-- POLICY: A user can see an agreement if they are the customer or the provider.
CREATE POLICY "Users can only view their own agreements."
ON public.agreements FOR SELECT
TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- POLICY: A user can only create an agreement where they are the customer.
CREATE POLICY "Customers can create their own agreements."
ON public.agreements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- POLICY: A provider can update an agreement intended for them (e.g., to change status).
CREATE POLICY "Providers can update agreements for them."
ON public.agreements FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id);
