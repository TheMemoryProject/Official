import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/organization',
  '/solutions',
  '/problems',
  '/operations',
  '/governance',
  '/developer',
  '/projects',
  '/marketplace',
  '/ingestion',
  // Added in Phase 0: these dashboard prefixes were reachable without a session cookie.
  // NOTE: this is a presence check only, not authentication — see capability
  // `auth.session-integrity` in capability-ledger.json. Session tokens are currently
  // unsigned user IDs and are trivially forgeable. This list reduces exposure; it does
  // not fix the underlying defect.
  '/admin',
  '/knowledge',
  '/evidence',
  '/failures',
  '/standards',
  '/analytics',
  '/graph',
  '/verification',
  '/decisions',
  '/discovery',
  '/matcher',
  '/translation',
  '/assistant',
  '/versions',
  '/tasks',
  '/integrations',
  '/collaboration',
  '/bookmarks',
  '/saved-searches',
  '/principles',
  '/activity',
  '/devops',
];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  // Add Enterprise Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
