/**
 * FluentCRM API Client
 * Integrace s WordPress FluentCRM pluginem pro správu kontaktů
 */

const FLUENTCRM_API_URL = process.env.FLUENTCRM_API_URL;
const FLUENTCRM_API_USERNAME = process.env.FLUENTCRM_API_USERNAME;
const FLUENTCRM_API_PASSWORD = process.env.FLUENTCRM_API_PASSWORD;

export interface FluentCRMContact {
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  source?: string;
  tags?: (string | number)[];
  lists?: (string | number)[];
  custom_values?: Record<string, any>;
}

export interface FluentCRMResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
}

export class FluentCRMClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    if (!FLUENTCRM_API_URL || !FLUENTCRM_API_USERNAME || !FLUENTCRM_API_PASSWORD) {
      console.warn('FluentCRM API není nakonfigurováno - chybí URL, username nebo password');
    }
    
    this.baseUrl = FLUENTCRM_API_URL!;
    this.username = FLUENTCRM_API_USERNAME!;
    this.password = FLUENTCRM_API_PASSWORD!;
    
    console.log('FluentCRM API konfigurace:', {
      hasUrl: !!FLUENTCRM_API_URL,
      hasUsername: !!FLUENTCRM_API_USERNAME,
      hasPassword: !!FLUENTCRM_API_PASSWORD,
      baseUrl: this.baseUrl ? this.baseUrl.substring(0, 30) + '...' : 'není nastaveno'
    });
  }

  /**
   * Obecná metoda pro API volání
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('FluentCRM není nakonfigurováno');
    }

    // Používáme přímo /wp-json/fluent-crm/v2/ endpoint podle dokumentace
    const url = `${this.baseUrl}/${endpoint}`;
    
    // Basic Auth podle dokumentace
    const authToken = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
    console.log('FluentCRM API request:', {
      url,
      method: options.method || 'GET',
      hasAuth: !!authToken,
      endpoint
    });
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('FluentCRM API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FluentCRM API error response:', errorText);
        throw new Error(`FluentCRM API error ${response.status}: ${errorText}`);
      }

      const jsonResponse = await response.json();
      console.log('FluentCRM API success response:', jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('FluentCRM API volání selhalo:', { 
        url,
        endpoint, 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  }

  /**
   * Přidat nový kontakt (subscriber podle FluentCRM API)
   */
  async addContact(contactData: FluentCRMContact): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Přidávám nový kontakt:', { email: contactData.email });
      
      const response = await this.request('subscribers', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });

      console.log('FluentCRM: Kontakt úspěšně přidán:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Chyba při přidávání kontaktu:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba',
        errors: [error instanceof Error ? error.message : 'Neznámá chyba']
      };
    }
  }

  /**
   * Test připojení k FluentCRM API
   */
  async testConnection(): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Testuji připojení...');
      
      // Zkusíme endpoint pro získání subscriberů (limit 1 pro test)
      const response = await this.request('subscribers?per_page=1');
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Test připojení selhal:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba' 
      };
    }
  }

  /**
   * Najít kontakt podle emailu
   */
  async findContactByEmail(email: string): Promise<any> {
    try {
      const response = await this.request(`subscribers?search=${encodeURIComponent(email)}`);
      // Podle dokumentace je struktura: { subscribers: { data: [...] } }
      const subscribers = response.subscribers?.data || response.data;
      return subscribers && subscribers.length > 0 ? subscribers[0] : null;
    } catch (error) {
      console.error('FluentCRM: Chyba při hledání kontaktu:', error);
      return null;
    }
  }

  /**
   * Aktualizovat existující kontakt
   */
  async updateContact(contactId: number, contactData: Partial<FluentCRMContact>): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Aktualizuji kontakt:', { contactId, data: contactData });
      
      const response = await this.request(`subscribers/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(contactData),
      });

      console.log('FluentCRM: Kontakt úspěšně aktualizován:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Chyba při aktualizaci kontaktu:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba' 
      };
    }
  }

  /**
   * Přidat tag ke kontaktu (podle dokumentace - používá PUT subscribers/{id} s attach_tags)
   */
  async addTagToContact(contactId: number, tagIdOrName: number | string): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Přidávám tag ke kontaktu:', { contactId, tagIdOrName });
      
      // Podle dokumentace používáme PUT method s attach_tags
      // Pokud je to string (název), převedeme na číslo nebo necháme jako je
      const tagIds = typeof tagIdOrName === 'number' 
        ? [tagIdOrName]
        : [tagIdOrName]; // Můžeme předat i název tagu
      
      const payload = {
        subscriber: {
          attach_tags: tagIds
        }
      };
      
      const response = await this.request(`subscribers/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      console.log('FluentCRM: Tag úspěšně přidán:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Chyba při přidávání tagu:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba' 
      };
    }
  }

  /**
   * Přidat kontakt do listu (podle dokumentace - používá PUT subscribers/{id} s attach_lists)
   */
  async addContactToList(contactId: number, listIdOrName: number | string): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Přidávám kontakt do listu:', { contactId, listIdOrName });
      
      // Podle dokumentace používáme PUT method s attach_lists
      // Pokud je to string (název), převedeme na číslo nebo necháme jako je
      const listIds = typeof listIdOrName === 'number' 
        ? [listIdOrName]
        : [listIdOrName]; // Můžeme předat i název listu
      
      const payload = {
        subscriber: {
          attach_lists: listIds
        }
      };
      
      const response = await this.request(`subscribers/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      console.log('FluentCRM: Kontakt úspěšně přidán do listu:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Chyba při přidávání do listu:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba' 
      };
    }
  }

  /**
   * Spustit automatizaci pro kontakt
   */
  async triggerAutomation(automationId: number, contactId: number): Promise<FluentCRMResponse> {
    try {
      console.log('FluentCRM: Spouštím automatizaci:', { automationId, contactId });
      
      const response = await this.request(`automations/${automationId}/trigger`, {
        method: 'POST',
        body: JSON.stringify({ contact_id: contactId }),
      });

      console.log('FluentCRM: Automatizace úspěšně spuštěna:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('FluentCRM: Chyba při spuštění automatizace:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Neznámá chyba' 
      };
    }
  }
}

// Vytvoření instance klienta
export const fluentCRM = new FluentCRMClient();

/**
 * Helper funkce pro přidání nového uživatele do FluentCRM
 */
export async function addUserToFluentCRM(user: { 
  email: string; 
  name?: string;
  source?: string;
}): Promise<FluentCRMResponse> {
  try {
    // 1. NEJPRVE test existence podle dokumentace
    console.log('FluentCRM: Kontroluji existenci kontaktu:', user.email);
    const existingContact = await fluentCRM.findContactByEmail(user.email);
    
    if (existingContact) {
      console.log('FluentCRM: Kontakt již existuje, přidávám pouze do listu "Kurzy":', user.email);
      
      // Pokud EXISTUJE - pouze přidat do listu "Kurzy" 
      // POZOR: ID listu je hardkódované - zkontroluj v FluentCRM admin rozhraní správné ID
      try {
        await fluentCRM.addContactToList(existingContact.id, 1012);
        console.log('FluentCRM: Existující kontakt úspěšně přidán do listu "Kurzy"');
      } catch (listError) {
        console.warn('FluentCRM: Nepodařilo se přidat existující kontakt do listu:', listError);
      }
      
      return { success: true, data: existingContact };
    }

    // 2. Pokud NEEXISTUJE - vytvořit nový kontakt podle dokumentace
    console.log('FluentCRM: Kontakt neexistuje, vytvářím nový:', user.email);
    
    const nameParts = user.name?.split(' ') || [];
    
    // Struktura podle dokumentace (řádky 85-100)
    const contactData: FluentCRMContact = {
      email: user.email,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      status: 'subscribed',
      source: user.source || 'registrace-web',
      tags: [] // Žádné tagy při registraci
    };

    const contactResult = await fluentCRM.addContact(contactData);
    
    if (contactResult.success && contactResult.data && contactResult.data.contact) {
      // 3. Přidat nový kontakt do listu "Kurzy"
      // POZOR: ID listu je hardkódované - zkontroluj v FluentCRM admin rozhraní správné ID
      try {
        console.log('FluentCRM: Přidávám nový kontakt do listu "Kurzy", ID:', contactResult.data.contact.id);
        await fluentCRM.addContactToList(contactResult.data.contact.id, 1012);
        console.log('FluentCRM: Nový kontakt úspěšně přidán do listu "Kurzy"');
      } catch (listError) {
        console.warn('FluentCRM: Nepodařilo se přidat nový kontakt do listu:', listError);
      }

      // 4. Obnovit tagy kurzů z databáze (pokud uživatel měl kurzy)
      try {
        console.log('FluentCRM: Synchronizuji tagy kurzů z databáze pro email:', user.email);
        await syncUserCourseTags(user.email, contactResult.data.contact.id);
      } catch (syncError) {
        console.warn('FluentCRM: Nepodařilo se synchronizovat tagy kurzů:', syncError);
      }
    }
    
    return contactResult;
  } catch (error) {
    console.error('FluentCRM: Chyba při přidávání uživatele:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Neznámá chyba' 
    };
  }
}

/**
 * Helper funkce pro aktualizaci uživatele po zakoupení kurzu
 */
export async function updateUserAfterPurchase(
  email: string, 
  courseName: string,
  courseSlug: string
): Promise<FluentCRMResponse> {
  try {
    // Najít kontakt podle e-mailu
    const contact = await fluentCRM.findContactByEmail(email);
    
    if (!contact) {
      console.warn('FluentCRM: Kontakt nenalezen pro email:', email);
      // Vytvoříme nový kontakt
      return await addUserToFluentCRM({ 
        email, 
        source: 'nakup-kurzu'
      });
    }

    console.log('FluentCRM: Aktualizuji kontakt po nákupu kurzu:', { email, courseName });

    // Přidat tag pro zakoupený kurz (pouze slug bez prefixu)
    const courseTag = courseSlug;
    await fluentCRM.addTagToContact(contact.id, courseTag);

    // Custom fields nepoužíváme

    // Spustit automatizaci pro nové zákazníky (ID 1 - upravit podle potřeby)
    // await fluentCRM.triggerAutomation(1, contact.id);

    return { success: true, data: contact };
  } catch (error) {
    console.error('FluentCRM: Chyba při aktualizaci po nákupu:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Neznámá chyba' 
    };
  }
}

/**
 * Helper funkce pro synchronizaci tagů kurzů z databáze do CRM
 */
async function syncUserCourseTags(email: string, contactId: number): Promise<void> {
  try {
    // Najít uživatele v databázi podle emailu
    const { prisma } = await import('@/lib/prisma');
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userCourses: {
          include: {
            course: {
              select: { slug: true, title: true }
            }
          }
        }
      }
    });

    if (!user || !user.userCourses || user.userCourses.length === 0) {
      console.log('FluentCRM: Uživatel nemá žádné kurzy k synchronizaci');
      return;
    }

    console.log(`FluentCRM: Synchronizuji ${user.userCourses.length} kurzů pro uživatele ${email}`);

    // Přidat tag pro každý kurz, který uživatel má
    for (const userCourse of user.userCourses) {
      try {
        const courseSlug = userCourse.course.slug;
        console.log(`FluentCRM: Synchronizuji tag kurzu: ${courseSlug}`);
        
        await fluentCRM.addTagToContact(contactId, courseSlug);
        console.log(`FluentCRM: Tag '${courseSlug}' úspěšně synchronizován`);
      } catch (tagError) {
        console.warn(`FluentCRM: Nepodařilo se synchronizovat tag kurzu ${userCourse.course.slug}:`, tagError);
      }
    }

    console.log('FluentCRM: Synchronizace tagů kurzů dokončena');
  } catch (error) {
    console.error('FluentCRM: Chyba při synchronizaci tagů kurzů:', error);
    throw error;
  }
}

/**
 * Helper funkce pro přidání uživatele k free kurzu
 */
export async function updateUserAfterFreeCourse(
  email: string, 
  courseName: string,
  courseSlug: string
): Promise<FluentCRMResponse> {
  try {
    const contact = await fluentCRM.findContactByEmail(email);
    
    if (!contact) {
      return await addUserToFluentCRM({ 
        email, 
        source: 'free-kurz'
      });
    }

    // Přidat tag pro free kurz (pouze slug bez prefixu)  
    const courseTag = courseSlug;
    await fluentCRM.addTagToContact(contact.id, courseTag);

    // Custom fields nepoužíváme

    return { success: true, data: contact };
  } catch (error) {
    console.error('FluentCRM: Chyba při aktualizaci po free kurzu:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Neznámá chyba' 
    };
  }
}
