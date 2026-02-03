import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';


// This function can be used in Server Components, Server Actions, and Route Handlers.
// It must not be used in middleware.
export const createClient = () => {
  // If mock data mode is on, return a mock client object that won't try to connect.
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      const mockUser: SupabaseUser = {
        id: 'mock-provider-id',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'هنرمند آزمایشی' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      const mockProfile: Profile = {
        id: 'mock-provider-id',
        account_type: 'provider',
        full_name: 'هنرمند آزمایشی',
        phone: '09123456789',
        profile_image_url: null,
        portfolio: [],
        service_id: null,
      };

    return {
      from: (tableName: string) => ({
        select: (query: string) => ({
          eq: (column: string, value: any) => ({
            single: () => {
              if (tableName === 'profiles' && column === 'id') {
                return Promise.resolve({ data: mockProfile, error: null });
              }
              return Promise.resolve({ data: null, error: { message: 'Mock mode: Not found', code: 'PGRST116' } as any })
            }
          }),
          or: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: () => Promise.resolve({ error: { message: 'Mock mode enabled' } }),
        update: () => Promise.resolve({ error: { message: 'Mock mode enabled' } }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      rpc: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
    } as any; // Using 'as any' to satisfy the complex SupabaseClient type for this mock.
  }


  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
