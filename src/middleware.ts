
      
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession() handles reading the request cookies, refreshing the session,
  // and setting new cookies in the response.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the homepage)
     * - /login (and its sub-pages like /login/verify)
     * - /register
     * - /api (API routes)
     * - /services (category and service listing pages)
     * - /search (search results page)
     * - /provider (public provider profile pages)
     * This MATCHER is now very specific. It only protects routes that ABSOLUTELY
     * require a valid, server-recognized session, like /profile and /inbox.
     * All other pages are public to prevent session invalidation issues.
     */
    '/profile/:path*',
    '/inbox/:path*',
  ],
}

    