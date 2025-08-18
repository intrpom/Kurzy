import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// API endpoint pro manuální vymazání cache
// Použití: 
// - Pro vymazání cache všech kurzů: /api/revalidate?path=/kurzy&secret=VAŠE_TAJNÉ_HESLO
// - Pro vymazání cache konkrétního kurzu: /api/revalidate?path=/kurzy/nazev-kurzu&secret=VAŠE_TAJNÉ_HESLO
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path');

  // Kontrola tajného klíče pro zabezpečení
  // V produkci by měl být tento klíč uložen v proměnných prostředí
  // Používáme NEXT_PUBLIC_ prefix, aby byl klíč dostupný i na klientovi
  const REVALIDATE_SECRET = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'tajny-klic-pro-revalidaci';
  
  if (!secret || secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Neplatný tajný klíč' },
      { status: 401 }
    );
  }

  if (!path) {
    return NextResponse.json(
      { message: 'Chybí parametr path' },
      { status: 400 }
    );
  }

  try {
    // Vymazání cache pro zadanou cestu
    revalidatePath(path);
    
    return NextResponse.json(
      { 
        revalidated: true, 
        message: `Cache pro cestu ${path} byla úspěšně vymazána`,
        date: new Date().toISOString()
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        revalidated: false, 
        message: `Chyba při vymazávání cache: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}
