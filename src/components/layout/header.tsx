// This component is now a pure Server Component.
// It fetches the user data on the server and passes it to the client component.

import HeaderClient from './HeaderClient';
import type { Profile } from '@/lib/types';
import { useAuth } from '../providers/auth-provider';


export default function Header() {
    
  // A user is fully logged in only if they have a session AND a complete profile
  const {profile, isLoggedIn} = useAuth();
  
  return <HeaderClient userProfile={profile} isLoggedIn={isLoggedIn} />;
}