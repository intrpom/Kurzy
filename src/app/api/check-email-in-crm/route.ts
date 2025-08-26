import { NextRequest, NextResponse } from 'next/server';
import { fluentCRM } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

/**
 * Kontrola existence emailu v FluentCRM
 * POST /api/check-email-in-crm
 * Body: { email: string, listId?: number }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== ZAČÁTEK KONTROLY EMAILU V CRM ===');
    
    const { email, listId } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Neplatná e-mailová adresa'
      }, { status: 400 });
    }
    
    console.log('Kontroluji existenci emailu:', email, listId ? `v listu ${listId}` : '');
    
    // Najít kontakt podle emailu
    const contact = await fluentCRM.findContactByEmail(email);
    
    if (!contact) {
      console.log('Kontakt neexistuje pro email:', email);
      return NextResponse.json({
        success: true,
        exists: false,
        contact: null,
        inList: false
      });
    }
    
    console.log('Kontakt nalezen:', { id: contact.id, email: contact.email });
    
    // Pokud je specifikován listId, zkontrolujeme zda je kontakt v daném listu
    let inList = false;
    if (listId && contact.lists) {
      // Převedeme oba na čísla pro správné porovnání
      const numericListId = Number(listId);
      inList = contact.lists.some((list: any) => Number(list.id) === numericListId);
      console.log(`Kontroluji list ID ${listId} (${numericListId}) vs kontakt lists:`, contact.lists.map((l: any) => `${l.id} (${l.title})`));
      console.log(`Kontakt ${inList ? 'JE' : 'NENÍ'} v listu ${listId}`);
    }
    
    console.log('=== KONEC KONTROLY EMAILU V CRM ===');
    
    return NextResponse.json({
      success: true,
      exists: true,
      contact: {
        id: contact.id,
        email: contact.email,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        full_name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        status: contact.status,
        contact_type: contact.contact_type,
        source: contact.source,
        created_at: contact.created_at,
        lists: contact.lists || [],
        tags: contact.tags || []
      },
      inList: listId ? inList : undefined
    });
    
  } catch (error) {
    console.error('Chyba při kontrole emailu v CRM:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Nepodařilo se zkontrolovat email v CRM',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    }, { status: 500 });
  }
}
