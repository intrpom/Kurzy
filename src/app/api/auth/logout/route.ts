import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Smazat session cookie
    cookies().delete('session');
    
    return NextResponse.json(
      { success: true, message: 'Odhlášení bylo úspěšné' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chyba při odhlašování:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku' },
      { status: 500 }
    );
  }
}
