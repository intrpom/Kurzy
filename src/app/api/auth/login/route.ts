import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { sendLoginEmail } from '@/lib/mailgun';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

// Funkce pro generování náhodného tokenu
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Funkce pro vytvoření expiračního času (24 hodin od teď)
function generateExpiryTime(): Date {
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 24);
  return expiryTime;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Neplatná e-mailová adresa' },
        { status: 400 }
      );
    }

    // Najít nebo vytvořit uživatele
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: 'user'
        }
      });
    }

    // Vytvořit nový token
    const token = generateToken();
    const expires = generateExpiryTime();

    // Uložit token do databáze pomocí raw SQL dotazu s lepším zachycením chyb
    try {
      console.log('Pokus o vytvoření tokenu pro uživatele:', user.email);
      console.log('Používám databázi:', process.env.DATABASE_URL ? 'URL nastavena' : 'URL chybí');
      
      // Vytvoříme unikátní ID pro token
      const tokenId = crypto.randomUUID();
      
      // Použijeme SQL dotaz přes Prisma s převodem data na timestamp
      await prisma.$executeRaw`
        INSERT INTO "AuthToken" ("id", "token", "expires", "userId", "createdAt")
        VALUES (${tokenId}, ${token}, ${expires}::timestamp, ${user.id}, CURRENT_TIMESTAMP)
      `;
      
      console.log('Token byl úspěšně vytvořen s ID:', tokenId);
    } catch (error: any) {
      console.error('Chyba při vytváření tokenu:', error);
      console.error('Detail chyby:', error.message);
      if (error.code) {
        console.error('Kód chyby:', error.code);
      }
      if (error.meta) {
        console.error('Metadata chyby:', error.meta);
      }
      
      // Vraťme chybu přímo klientovi pro lepší diagnostiku
      return NextResponse.json(
        { error: `Chyba při vytváření tokenu: ${error.message}` },
        { status: 500 }
      );
    }

    // Sestavit URL pro přihlášení
    // Použijeme aktuální URL z požadavku, pokud není nastavená proměnná prostředí
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!baseUrl) {
      // Pokud není nastavená proměnná prostředí, použijeme origin z požadavku
      // nebo doménu z Vercel
      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http:' : 'https:';
      baseUrl = `${protocol}//${host}`;
      console.log('Používám automaticky detekovanou URL:', baseUrl);
    }
    
    const loginUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Odeslat e-mail s přihlašovacím odkazem
    let emailSent = false;
    
    try {
      // Kontrola existence proměnných prostředí
      if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
        console.error('Chybí Mailgun API klíč nebo doména');
        return NextResponse.json(
          { error: 'Chyba konfigurace e-mailového serveru' },
          { status: 500 }
        );
      }
      
      // Pokud jsme v produkčním prostředí, odeslat e-mail
      if (process.env.NODE_ENV === 'production') {
        console.log('Odesílání e-mailu v produkčním prostředí...');
        emailSent = await sendLoginEmail(email, loginUrl);
        console.log('Výsledek odeslání e-mailu:', emailSent);
      } else {
        // V vývojovém prostředí pouze vypíšeme URL do konzole
        console.log('Magic link URL (vývojové prostředí):', loginUrl);
        emailSent = true; // Simulujeme úspěšné odeslání
      }
    } catch (emailError) {
      console.error('Chyba při odesílání e-mailu:', emailError);
      return NextResponse.json(
        { error: 'Nepodařilo se odeslat přihlašovací odkaz' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: emailSent, 
        message: emailSent ? 'Přihlašovací odkaz byl odeslán' : 'Nepodařilo se odeslat přihlašovací odkaz',
        // V produkční verzi vracíme URL pouze pro vývojové prostředí
        ...(process.env.NODE_ENV !== 'production' ? { url: loginUrl } : {})
      },
      { status: emailSent ? 200 : 500 }
    );
  } catch (error) {
    console.error('Chyba při vytváření přihlašovacího odkazu:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku' },
      { status: 500 }
    );
  }
}
