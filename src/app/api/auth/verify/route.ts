import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const timestamp = searchParams.get('_');
    
    // Kontrola, zda již byla nastavena session cookie
    const sessionCookie = cookies().get('session');
    if (sessionCookie) {
      try {
        // Zkusíme dekódovat session cookie a vrátit data uživatele
        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
        if (sessionData && sessionData.id && sessionData.email) {
          return NextResponse.json(
            { 
              success: true, 
              user: {
                id: sessionData.id,
                email: sessionData.email,
                name: sessionData.name,
                role: sessionData.role,
              },
              fromCache: true
            },
            { 
              status: 200,
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            }
          );
        }
      } catch (e) {
        // Pokračujeme v normálním zpracování
      }
    }

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Chybějící token nebo e-mail' },
        { status: 400 }
      );
    }

    // Definice typu pro výsledek SQL dotazu
    type AuthTokenWithUser = {
      id: string;
      token: string;
      expires: Date;
      userId: string;
      email: string;
      name: string | null;
      role: string;
    };

    // Najít token a uživatele v databázi pomocí raw SQL
    const result = await prisma.$queryRaw<AuthTokenWithUser[]>`
      SELECT t.id, t.token, t.expires, u.id as "userId", u.email, u.name, u.role
      FROM "AuthToken" t
      JOIN "User" u ON t."userId" = u.id
      WHERE t.token = ${token}
      LIMIT 1
    `;

    const authToken = result[0];

    if (!authToken) {
      return NextResponse.json(
        { 
          error: 'Tento přihlašovací odkaz již byl použit nebo vypršel', 
          details: 'Pokud se potřebujete přihlásit znovu, požádejte o nový přihlašovací odkaz.',
          action: 'token_already_used'
        },
        { status: 400 }
      );
    }

    // Zkontrolovat, zda token není expirovaný
    const now = new Date();
    const expires = new Date(authToken.expires);
    
    if (now > expires) {
      // Smazat expirovaný token
      await prisma.$executeRaw`DELETE FROM "AuthToken" WHERE id = ${authToken.id}`;
      
      return NextResponse.json(
        { 
          error: 'Platnost přihlašovacího odkazu vypršela', 
          details: 'Přihlašovací odkazy jsou platné pouze 24 hodin. Požádejte o nový odkaz.',
          action: 'token_expired'
        },
        { status: 400 }
      );
    }

    // Zkontrolovat, zda e-mail odpovídá uživateli
    if (authToken.email !== email) {
      return NextResponse.json(
        { error: 'Neplatný e-mail' },
        { status: 400 }
      );
    }

    // Smazat použitý token
    await prisma.$executeRaw`DELETE FROM "AuthToken" WHERE id = ${authToken.id}`;

    // Vytvořit session cookie
    const sessionData = {
      id: authToken.userId,
      email: authToken.email,
      name: authToken.name,
      role: authToken.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 dní
    };
    
    // Zakódujeme data do Base64 pro lepší kompatibilitu
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    // Detekce prostředí pro správné nastavení cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const host = request.headers.get('host') || '';
    const isVercel = host.includes('vercel.app') || host.includes('ales-kalina.cz');
    
    console.log('Cookie nastavení:', { isProduction, host, isVercel });
    console.log('Nastavuji cookies pro uživatele:', authToken.email);
    console.log('Session data pro cookie:', sessionData);
    
    // Nastavíme cookie s parametry vhodnými pro produkční prostředí
    // Pro Vercel vždy používáme secure: true a sameSite: 'lax'
    const cookieSettings = {
      httpOnly: true,
      secure: true, // Vždy secure pro HTTPS
      sameSite: 'lax' as const, // 'lax' je nejkompatibilnější pro Vercel
      path: '/',
      domain: undefined, // Necháme undefined pro automatické nastavení
      maxAge: 60 * 60 * 24 * 7, // 7 dní
    };
    
    cookies().set({
      name: 'session',
      value: sessionValue,
      ...cookieSettings
    });
    
    // Nastavíme také záložní cookie pro případ, že by httpOnly nefungovalo
    cookies().set({
      name: 'session_check',
      value: 'true',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 dní
    });
    
    // Nastavíme ještě jednu non-httpOnly cookie s uživatelským ID pro kontrolu na klientovi
    cookies().set({
      name: 'user_id',
      value: authToken.userId,
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 dní
    });

    console.log('✅ Cookies byly nastaveny pro uživatele:', authToken.email);
    console.log('Cookie hodnoty:', {
      session: sessionValue.substring(0, 20) + '...',
      user_id: authToken.userId,
      session_check: 'true'
    });

    // Připravit data pro odpověď
    const userData = {
      id: authToken.userId,
      email: authToken.email,
      name: authToken.name,
      role: authToken.role,
    };

    return NextResponse.json(
      { 
        success: true, 
        user: userData
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('API: Chyba při ověřování tokenu:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku', details: error instanceof Error ? error.message : 'Neznámá chyba' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
