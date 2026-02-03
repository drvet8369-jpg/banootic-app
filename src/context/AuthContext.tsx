// This file is deprecated and no longer in use.
// The new authentication system uses `src/components/providers/auth-provider.tsx`
// which correctly handles Supabase sessions.
// This file can be safely deleted in a future cleanup.

import React from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => {
    // This mock implementation prevents crashes in components that might still import it
    // during the transition.
    return {
        isLoggedIn: false,
        user: null,
        login: () => {},
        logout: () => {}
    }
}
