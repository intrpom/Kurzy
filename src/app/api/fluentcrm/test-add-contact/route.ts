import { NextRequest, NextResponse } from 'next/server';
import { addUserToFluentCRM } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint pro přidání kontaktu do FluentCRM
 * POST /api/fluentcrm/test-add-contact
 * Body: { email: string, name?: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST PŘIDÁNÍ KONTAKTU DO FLUENTCRM ===');
    
    const { email, name } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Neplatná e-mailová adresa'
      }, { status: 400 });
    }
    
    console.log('Testuji přidání kontaktu:', { email, name });
    
    const result = await addUserToFluentCRM({
      email,
      name: name || 'Test User',
      source: 'test-endpoint'
    });
    
    console.log('Výsledek testu:', result);
    console.log('=== KONEC TESTU ===');
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      message: result.message || (result.success ? 'Kontakt úspěšně zpracován' : 'Chyba při zpracování'),
      errors: result.errors
    });
    
  } catch (error) {
    console.error('Chyba při testu přidání kontaktu:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Nepodařilo se provést test',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    }, { status: 500 });
  }
}
