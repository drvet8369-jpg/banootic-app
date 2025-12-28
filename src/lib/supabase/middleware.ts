import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // This response object will be modified by the Supabase client.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The Supabase client will modify the response directly.
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // The Supabase client will modify the response directly.
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  console.log('--- Middleware Log: Start ---');
  console.log(`Request Path: ${request.nextUrl.pathname}`);
  
  // Log existing cookies before refresh
  const sessionCookie = request.cookies.get('sb-rfiybvlqdibtwckbgscu-auth-token');
  console.log(`1. Before refresh: Session cookie exists? ${!!sessionCookie}`);

  // This will refresh the session if it's expired.
  const { data: { user } } = await supabase.auth.getUser();

  // Log session status after refresh
  console.log(`2. After refresh: User object exists? ${!!user}`);
  if (user) {
    console.log(`   User ID: ${user.id}`);
  }
  console.log('--- Middleware Log: End ---');

  // The response object has been modified by the Supabase client.
  return response;
}
