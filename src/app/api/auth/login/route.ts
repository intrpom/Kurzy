import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { sendLoginEmail } from '@/lib/mailgun';
import { addUserToFluentCRM } from '@/lib/fluentcrm';

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
    const { email, name, courseId, slug, price, action, returnUrl } = await request.json();

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

    let isNewUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          role: 'user'
        }
      });
      isNewUser = true;
    } else if (name && (!user.name || user.name !== name)) {
      // Aktualizovat jméno pokud je zadané a liší se od současného
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name }
      });
    }

    // Zkontrolovat FluentCRM při každém přihlášení (nejen nových uživatelů)
    try {
      console.log('Kontroluji FluentCRM při přihlášení uživatele:', email);
      
      // Nejprve test připojení (pouze pro debug)
      if (process.env.NODE_ENV !== 'production') {
        const { fluentCRM } = await import('@/lib/fluentcrm');
        const testResult = await fluentCRM.testConnection();
        console.log('FluentCRM test připojení:', testResult);
      }
      
      const fluentResponse = await addUserToFluentCRM({ 
        email,
        name: name || undefined,
        source: 'registrace-web'
      });
      
      if (fluentResponse.success) {
        if (isNewUser) {
          console.log('Nový uživatel přidán do FluentCRM:', email);
        } else {
          console.log('Existující uživatel v FluentCRM zkontrolován:', email);
        }
      } else {
        console.warn('Nepodařilo se zkontrolovat/přidat uživatele do FluentCRM:', fluentResponse.message);
      }
    } catch (error) {
      console.error('Chyba při komunikaci s FluentCRM:', error);
      // Pokračujeme i když se nepodaří komunikovat s CRM - nekritická chyba
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
    
    // Sestavit URL s parametry
    const urlParams = new URLSearchParams({
      token,
      email
    });
    
    // Přidat volitelné parametry pokud existují
    if (courseId) urlParams.set('courseId', courseId);
    if (slug) urlParams.set('slug', slug);
    if (price) urlParams.set('price', price);
    if (action) urlParams.set('action', action);
    if (returnUrl) urlParams.set('returnUrl', returnUrl);
    
    const loginUrl = `${baseUrl}/auth/verify?${urlParams.toString()}`;

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
