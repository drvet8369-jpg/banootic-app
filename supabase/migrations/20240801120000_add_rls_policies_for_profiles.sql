
-- Enable Row Level Security for the profiles table
alter table "public"."profiles" enable row level security;

-- Drop existing policies if they exist to prevent conflicts
drop policy if exists "Allow public read access to profiles" on "public"."profiles";
drop policy if exists "Allow users to update their own profile" on "public"."profiles";

-- Policy 1: Allow public read access
-- Anyone can view profiles. This is necessary for pages to show user names, etc.
create policy "Allow public read access to profiles"
on "public"."profiles"
for select
to public
using ( true );

-- Policy 2: Allow users to update their own profile
-- A logged-in user can only update the row where the ID matches their own user ID.
create policy "Allow users to update their own profile"
on "public"."profiles"
for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );
