import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow static files, Next.js internal assets, and public images
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico' ||
    path === '/pwasite.png'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('pwa_session_id');
  const isAuthenticated = !!sessionCookie?.value;

  // 1. If NOT authenticated and trying to access any protected page (not /login)
  if (!isAuthenticated && path !== '/login') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'login_required');
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated and trying to access /login page -> redirect to Home Dashboard
  if (isAuthenticated && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
