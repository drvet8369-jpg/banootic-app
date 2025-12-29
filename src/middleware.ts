import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Global middleware
 * This is responsible for:
 * - Reading Supabase cookies
 * - Refreshing the session if needed
 * - Injecting the valid session into subsequent requests
 */
export async function middleware(request: NextRequest) {
  // This function will handle refreshing the user's session and updating the cookies.
  return await updateSession(request);
}

/**
 * matcher:
 * - Covers all paths
 * - Excludes static files, images, and the favicon
 * - Includes server actions and auth pages
 */
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
};
