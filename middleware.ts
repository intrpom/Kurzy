import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ochrana admin stránek
  if (pathname.startsWith('/admin')) {
    try {
      const session = await verifySession(request);
      
      // Pokud není uživatel přihlášen, přesměruj na login
      if (!session) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Pokud uživatel není admin, přesměruj na hlavní stránku
      if (session.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Uživatel je admin, pokračuj
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware chyba při ověřování admin přístupu:', error);
      // V případě chyby přesměruj na login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pro ostatní stránky pokračuj normálně
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ochrana admin stránek
    '/admin/:path*',
    // Můžeme přidat další chráněné cesty zde
  ]
};
