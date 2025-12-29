// This component is now a pure Server Component.
// It fetches the user data on the server and passes it to the client component.

import { createClient } from '@/lib/supabase/server';
import HeaderClient from './HeaderClient';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile } from '@/lib/types';

export default async function Header() {
  noStore(); // Ensure the header is always dynamic and not cached
  const supabase = createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  
  let userProfile: Profile | null = null;
  if (sessionUser) {
    const { data } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
    if(data) {
        userProfile = data;
    }
  }

  // A user is fully logged in only if they have a session AND a complete profile
  const isLoggedIn = !!sessionUser && !!userProfile?.full_name;

  return <HeaderClient userProfile={userProfile} isLoggedIn={isLoggedIn} />;
}
