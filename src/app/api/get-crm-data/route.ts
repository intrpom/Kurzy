import { NextRequest, NextResponse } from 'next/server';
import { fluentCRM } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

// Mapování zdrojů podle dokumentace
const resourceMap: Record<string, string> = {
  'contacts': 'subscribers',
  'tags': 'tags', 
  'lists': 'lists',
  'custom-fields': 'custom-fields',
  'forms': 'forms'
};

// Dostupné zdroje
const availableResources = [
  'contacts',       // Kontakty
  'tags',           // Tagy
  'lists',          // Seznamy
  'custom-fields',  // Vlastní pole
  'forms'           // Formuláře
];

// Dostupné akce
const availableActions = [
  'get',            // Získat jeden nebo více zdrojů
  'meta'            // Získat metadata o zdroji
];

/**
 * Obecné CRM data endpoint
 * GET /api/get-crm-data?resource={resource}&action={action}&id={id}
 * 
 * Podporované zdroje: contacts, tags, lists, custom-fields, forms
 * Podporované akce: get, meta
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== ZAČÁTEK ZÍSKÁVÁNÍ CRM DAT ===');
    
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const action = searchParams.get('action') || 'get';
    const id = searchParams.get('id');
    
    // Validace parametrů
    if (!resource) {
      return NextResponse.json({
        success: false,
        error: 'Chybí parametr resource',
        availableResources,
        availableActions
      }, { status: 400 });
    }
    
    if (!availableResources.includes(resource)) {
      return NextResponse.json({
        success: false,
        error: `Nepodporovaný zdroj: ${resource}`,
        availableResources,
        availableActions
      }, { status: 400 });
    }
    
    if (!availableActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Nepodporovaná akce: ${action}`,
        availableResources,
        availableActions
      }, { status: 400 });
    }
    
    console.log('Získávám CRM data:', { resource, action, id });
    
    // Mapování zdroje na FluentCRM endpoint
    const endpoint = resourceMap[resource];
    
    let apiEndpoint = endpoint;
    
    // Pokud je specifikované ID, přidáme ho
    if (id && action === 'get') {
      apiEndpoint = `${endpoint}/${id}`;
    }
    
    // Pro metadata použijeme jiný endpoint
    if (action === 'meta') {
      apiEndpoint = `${endpoint}/meta`;
    }
    
    console.log('Volám FluentCRM API endpoint:', apiEndpoint);
    
    // Volání FluentCRM API
    const response = await fluentCRM.request(apiEndpoint);
    
    console.log('CRM data úspěšně získána');
    console.log('=== KONEC ZÍSKÁVÁNÍ CRM DAT ===');
    
    return NextResponse.json({
      success: true,
      resource,
      action,
      id,
      data: response
    });
    
  } catch (error) {
    console.error('Chyba při získávání CRM dat:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Nepodařilo se získat CRM data',
      details: error instanceof Error ? error.message : 'Neznámá chyba',
      availableResources,
      availableActions
    }, { status: 500 });
  }
}
