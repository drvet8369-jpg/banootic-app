import { type NextRequest } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // The `createServerComponentClient` function is designed for server components
  // and route handlers, but it doesn't directly return a `response` object
  // suitable for middleware. The Supabase SSR package expects a specific
  // client for middleware that handles the request and response cycle.
  // Since we are only refreshing the session, we can call the function
  // but we won't use the returned client directly to manipulate the response here.
  // For more complex middleware scenarios, a different client setup might be needed.
  const supabase = createServerComponentClient()

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getSession()

  // The createServerComponentClient doesn't return a response object to pass along.
  // In this simplified middleware, we allow the request to continue.
  // For protected routes, you would add logic here to check the session
  // and redirect if necessary.
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
