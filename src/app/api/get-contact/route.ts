import { NextRequest, NextResponse } from 'next/server';
import { fluentCRM } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

/**
 * Získání detailních informací o kontaktu z FluentCRM
 * POST /api/get-contact
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== ZAČÁTEK ZÍSKÁVÁNÍ KONTAKTU Z CRM ===');
    
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Neplatná e-mailová adresa'
      }, { status: 400 });
    }
    
    console.log('Hledám kontakt pro email:', email);
    
    // Najít kontakt podle emailu
    const contact = await fluentCRM.findContactByEmail(email);
    
    if (!contact) {
      console.log('Kontakt nenalezen pro email:', email);
      return NextResponse.json({
        success: false,
        error: 'Kontakt nenalezen',
        contact: null
      });
    }
    
    console.log('Kontakt nalezen, získávám detaily...');
    
    // Získat detailní informace o kontaktu
    let detailedContact = contact;
    
    try {
      // Podle dokumentace: GET /subscribers/{id}?with[]=custom_values&with[]=subscriber.custom_values
      const detailResponse = await fluentCRM.request(
        `subscribers/${contact.id}?with[]=custom_values&with[]=subscriber.custom_values`
      );
      
      if (detailResponse && detailResponse.subscriber) {
        detailedContact = detailResponse.subscriber;
      }
    } catch (error) {
      console.warn('Nepodařilo se získat detailní informace, používám základní:', error);
      // Pokračujeme se základními informacemi
    }
    
    console.log('Kontakt úspěšně nalezen a zpracován');
    console.log('=== KONEC ZÍSKÁVÁNÍ KONTAKTU Z CRM ===');
    
    return NextResponse.json({
      success: true,
      contact: {
        id: detailedContact.id,
        email: detailedContact.email,
        first_name: detailedContact.first_name || '',
        last_name: detailedContact.last_name || '',
        full_name: detailedContact.full_name || `${detailedContact.first_name || ''} ${detailedContact.last_name || ''}`.trim(),
        status: detailedContact.status,
        contact_type: detailedContact.contact_type,
        source: detailedContact.source,
        created_at: detailedContact.created_at,
        updated_at: detailedContact.updated_at,
        custom_values: detailedContact.custom_values || {},
        tags: detailedContact.tags || [],
        lists: detailedContact.lists || [],
        total_points: detailedContact.total_points || '0',
        life_time_value: detailedContact.life_time_value || '0'
      }
    });
    
  } catch (error) {
    console.error('Chyba při získávání kontaktu z CRM:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Nepodařilo se získat kontakt z CRM',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    }, { status: 500 });
  }
}
