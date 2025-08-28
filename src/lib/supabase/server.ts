
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This file is for creating Supabase clients in SERVER-SIDE environments.
// It is safe to use in Server Components, Server Actions, and Route Handlers.
// It should not be used in Client Components.

// This function creates a Supabase client for a Server Component or Route Handler.
// It reads the user's session from the cookies and is used for operations
// that should be performed on behalf of the current user.
export const createServerComponentClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen in Server Components. It's safe to ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // This can happen in Server Components. It's safe to ignore.
          }
        },
      },
    }
  )
}

// This function creates a Supabase client with elevated privileges for server-side
// operations that need to bypass RLS policies. It uses the service_role key.
// IMPORTANT: Never expose this client to the browser or client-side code.
export const createAdminClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // The admin client does not need to manage cookies.
        // We provide a dummy implementation to satisfy the type.
        get(name: string) {
          return undefined;
        },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
      auth: {
        // The admin client should not persist sessions.
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
};
