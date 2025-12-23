import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // The `updateSession` function reads the request cookies, refreshes the
  // session if necessary, and writes the updated cookies to the response.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - login (login flow pages)
     * - register (registration flow pages)
     * This prevents the middleware from running on these paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|register).*)',
  ],
}
