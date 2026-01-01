
// This component is now a pure Server Component.
// It fetches the user data on the server and passes it to the client component.

import { createClient } from '@/lib/supabase/server';
import HeaderClient from './HeaderClient';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile } from '@/lib/types';

export default async function Header() {
  noStore(); // Ensure the header is always dynamic and not cached
  console.log('[Header SC] Rendering Header Server Component...');
  const supabase = createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  
  let userProfile: Profile | null = null;
  if (sessionUser) {
    console.log(`[Header SC] Found session user: ${sessionUser.id}`);
    const { data } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
    if(data) {
        console.log(`[Header SC] Found profile for user: ${data.full_name}`);
        userProfile = data;
    } else {
        console.log(`[Header SC] No profile found for user ID: ${sessionUser.id}`);
    }
  } else {
    console.log('[Header SC] No session user found.');
  }

  // A user is fully logged in only if they have a session AND a complete profile
  const isLoggedIn = !!sessionUser && !!userProfile?.full_name;
  console.log(`[Header SC] Final isLoggedIn status: ${isLoggedIn}`);

  return <HeaderClient userProfile={userProfile} isLoggedIn={isLoggedIn} />;
}
