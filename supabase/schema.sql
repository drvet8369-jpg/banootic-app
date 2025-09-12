-- Create a table for public profiles
CREATE TABLE profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  account_type text,
  -- Provider specific fields
  service text,
  location text,
  bio text,
  category_slug text,
  service_slug text,
  rating float,
  reviews_count integer,
  profile_image jsonb,
  portfolio jsonb[],
  phone text,

  PRIMARY KEY (id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.phone, new.raw_user_meta_data->>'account_type');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a table for one-time passwords
CREATE TABLE one_time_passwords (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set up Row Level Security for OTP table
ALTER TABLE one_time_passwords ENABLE ROW LEVEL SECURITY;
-- No policies are needed as this table will only be accessed by the service_role key from server-side actions.
