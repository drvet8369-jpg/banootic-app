'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This file is for creating a Supabase client specifically for use in
// SERVER ACTIONS. It's a separate file to ensure 'use server' is declared.
// It is important that this file only contains the client creation logic
// and does not export any server actions itself.

// This function must be async to comply with Server Action requirements,
// even if it doesn't use await itself.
export async function createActionClient() {
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
