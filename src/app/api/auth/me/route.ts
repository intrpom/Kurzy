import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      // Vracíme status 200 místo 401, abychom předešli chybám v konzoli
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      
      // Kontrola expirace
      if (sessionData.exp < Math.floor(Date.now() / 1000)) {
        cookies().delete('session');
        return NextResponse.json(
          { authenticated: false, error: 'Session expired' },
          { status: 200 }
        );
      }

      // Získat aktuální data uživatele
      const user = await prisma.user.findUnique({
        where: { id: sessionData.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      if (!user) {
        cookies().delete('session');
        return NextResponse.json(
          { authenticated: false, error: 'User not found' },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          authenticated: true, 
          user
        },
        { status: 200 }
      );
    } catch (error) {
      cookies().delete('session');
      return NextResponse.json(
        { authenticated: false, error: 'Invalid session' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Chyba při získávání informací o uživateli:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku' },
      { status: 500 }
    );
  }
}
