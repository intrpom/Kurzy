import { NextRequest, NextResponse } from 'next/server';
import { fluentCRM } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

/**
 * Test FluentCRM API připojení
 * GET /api/fluentcrm/test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== ZAČÁTEK TESTU FLUENTCRM API ===');
    
    // Kontrola environment variables
    const hasUrl = !!process.env.FLUENTCRM_API_URL;
    const hasUsername = !!process.env.FLUENTCRM_API_USERNAME;
    const hasPassword = !!process.env.FLUENTCRM_API_PASSWORD;
    
    console.log('Environment proměnné:', {
      hasUrl,
      hasUsername,
      hasPassword,
      url: process.env.FLUENTCRM_API_URL ? 
        process.env.FLUENTCRM_API_URL.substring(0, 30) + '...' : 
        'není nastaveno'
    });
    
    if (!hasUrl || !hasUsername || !hasPassword) {
      return NextResponse.json({
        success: false,
        error: 'FluentCRM není správně nakonfigurováno',
        details: {
          hasUrl,
          hasUsername,
          hasPassword,
          message: 'Chybějící environment proměnné: FLUENTCRM_API_URL, FLUENTCRM_API_USERNAME, FLUENTCRM_API_PASSWORD'
        }
      }, { status: 400 });
    }
    
    // Test základního připojení
    console.log('Spouštím test připojení k FluentCRM...');
    const testResult = await fluentCRM.testConnection();
    
    if (!testResult.success) {
      console.error('Test připojení selhal:', testResult.message);
      return NextResponse.json({
        success: false,
        error: 'Test připojení k FluentCRM selhal',
        details: {
          message: testResult.message,
          hasCredentials: true
        }
      }, { status: 500 });
    }
    
    console.log('Test připojení úspěšný:', testResult.data);
    
    // Zkusit najít testovací kontakt (pokud existuje)
    let testContactResult = null;
    try {
      console.log('Zkouším najít testovací kontakt...');
      const testContact = await fluentCRM.findContactByEmail('test@example.com');
      testContactResult = {
        found: !!testContact,
        contact: testContact ? {
          id: testContact.id,
          email: testContact.email,
          first_name: testContact.first_name,
          last_name: testContact.last_name
        } : null
      };
    } catch (error) {
      console.warn('Chyba při hledání testovacího kontaktu:', error);
      testContactResult = {
        error: error instanceof Error ? error.message : 'Neznámá chyba'
      };
    }
    
    console.log('=== KONEC TESTU FLUENTCRM API ===');
    
    return NextResponse.json({
      success: true,
      message: 'FluentCRM API test úspěšný',
      details: {
        connection: testResult.data,
        testContact: testContactResult,
        timestamp: new Date().toISOString(),
        environment: {
          hasUrl,
          hasUsername,
          hasPassword,
          url: process.env.FLUENTCRM_API_URL?.substring(0, 50) + '...'
        }
      }
    });
    
  } catch (error) {
    console.error('Chyba při testu FluentCRM API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Neočekávaná chyba při testu FluentCRM API',
      details: {
        message: error instanceof Error ? error.message : 'Neznámá chyba',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
