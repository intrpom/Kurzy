import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('API: /api/auth/verify - začátek zpracování požadavku');
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const timestamp = searchParams.get('_');
    
    // Kontrola, zda již byla nastavena session cookie
    const sessionCookie = cookies().get('session');
    if (sessionCookie) {
      console.log('API: Session cookie již existuje, pravděpodobně duplicitní požadavek');
      
      try {
        // Zkusíme dekódovat session cookie a vrátit data uživatele
        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
        if (sessionData && sessionData.id && sessionData.email) {
          console.log('API: Vracím data z existující session cookie');
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
        console.log('API: Chyba při dekódování session cookie:', e);
        // Pokračujeme v normálním zpracování
      }
    }
    
    console.log('API: Parametry požadavku:', { token: token?.substring(0, 10) + '...', email });

    if (!token || !email) {
      console.log('API: Chybí token nebo email');
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

    console.log('API: Hledám token v databázi');
    
    // Najít token a uživatele v databázi pomocí raw SQL
    const result = await prisma.$queryRaw<AuthTokenWithUser[]>`
      SELECT t.id, t.token, t.expires, u.id as "userId", u.email, u.name, u.role
      FROM "AuthToken" t
      JOIN "User" u ON t."userId" = u.id
      WHERE t.token = ${token}
      LIMIT 1
    `;
    
    console.log('API: Výsledek dotazu:', { found: result.length > 0 });

    const authToken = result[0];

    if (!authToken) {
      console.log('API: Token nebyl nalezen v databázi');
      return NextResponse.json(
        { error: 'Neplatný token' },
        { status: 400 }
      );
    }
    
    console.log('API: Token nalezen, uživatel:', { email: authToken.email });

    // Zkontrolovat, zda token není expirovaný
    const now = new Date();
    const expires = new Date(authToken.expires);
    console.log('API: Kontrola expirace tokenu:', { now, expires, isExpired: now > expires });
    
    if (now > expires) {
      console.log('API: Token vypršel');
      // Smazat expirovaný token
      await prisma.$executeRaw`DELETE FROM "AuthToken" WHERE id = ${authToken.id}`;
      
      return NextResponse.json(
        { error: 'Token vypršel' },
        { status: 400 }
      );
    }

    // Zkontrolovat, zda e-mail odpovídá uživateli
    console.log('API: Kontrola emailu:', { tokenEmail: authToken.email, requestEmail: email });
    if (authToken.email !== email) {
      console.log('API: Email neodpovídá tokenu');
      return NextResponse.json(
        { error: 'Neplatný e-mail' },
        { status: 400 }
      );
    }

    // Smazat použitý token
    console.log('API: Mažu použitý token');
    await prisma.$executeRaw`DELETE FROM "AuthToken" WHERE id = ${authToken.id}`;
    console.log('API: Token smazán');

    // Vytvořit session cookie
    console.log('API: Vytvářím session cookie');
    const sessionData = {
      id: authToken.userId,
      email: authToken.email,
      name: authToken.name,
      role: authToken.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 dní
    };
    
    console.log('Vytvářím session cookie s daty:', sessionData);
    
    // Získáme doménu z referer nebo host headeru
    let domain: string | undefined = undefined;
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    const origin = request.headers.get('origin');
    
    console.log('Hlavičky požadavku:', { 
      referer, 
      host, 
      origin,
      'user-agent': request.headers.get('user-agent')
    });
    
    if (referer) {
      try {
        const url = new URL(referer);
        domain = url.hostname;
        console.log('Získána doména z referer:', domain);
      } catch (error) {
        console.error('Chyba při parsování referer URL:', error);
      }
    } else if (host) {
      domain = host.split(':')[0]; // Odstraníme port, pokud existuje
      console.log('Získána doména z host headeru:', domain);
    }
    
    // Kontrola, zda jsme v produkčním prostředí (Vercel)
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log('Prostředí:', { isProduction, isVercel });
    
    // Zakódujeme data do Base64 pro lepší kompatibilitu
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    console.log('Zakódovaná session data (base64):', sessionValue);
    
    // Nastavíme cookie s parametry vhodnými pro produkční prostředí
    cookies().set({
      name: 'session',
      value: sessionValue,
      httpOnly: true,
      secure: true, // Vždy použít secure pro Vercel
      sameSite: 'none', // Vždy použít 'none' pro Vercel
      path: '/',
      // Nepoužíváme doménu v produkci, nechat ji undefined
      domain: undefined, // Nepoužíváme doménu vůbec
      maxAge: 60 * 60 * 24 * 7, // 7 dní
    });
    
    console.log('Nastavená hlavní session cookie s parametry:', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: undefined,
      maxAge: 60 * 60 * 24 * 7
    });
    
    // Nastavíme také záložní cookie pro případ, že by httpOnly nefungovalo
    cookies().set({
      name: 'session_check',
      value: 'true',
      httpOnly: false,
      secure: true,
      sameSite: 'none',
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
      sameSite: 'none',
      path: '/',
      domain: undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 dní
    });
    
    // Zkontrolujeme, zda byla cookie nastavena
    const setCookie = cookies().get('session');
    console.log('Cookie byla nastavena:', setCookie ? 'ano' : 'ne');
    console.log('API: Session cookie nastavena');

    // Připravit data pro odpověď
    const userData = {
      id: authToken.userId,
      email: authToken.email,
      name: authToken.name,
      role: authToken.role,
    };

    console.log('API: Vracím úspěšnou odpověď s uživatelskými daty');
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
