import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Inicializace Mailgun klienta
const mailgun = new Mailgun(formData);

// Vytvoření instance klienta s API klíčem
// Zkoušíme použít globální region místo EU
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: 'https://api.mailgun.net', // Globální API endpoint (US region)
});

// Doména, ze které budou e-maily odesílány
const DOMAIN = process.env.MAILGUN_DOMAIN || '';

/**
 * Funkce pro odeslání e-mailu s přihlašovacím odkazem
 * @param email E-mailová adresa příjemce
 * @param loginUrl URL pro přihlášení
 * @returns Promise s výsledkem odeslání
 */
export async function sendLoginEmail(email: string, loginUrl: string): Promise<boolean> {
  // Kontrola existence proměnných prostředí
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Chybí Mailgun API klíč nebo doména');
    return false;
  }

  // Kontrola, zda doména není prázdná
  if (!DOMAIN) {
    console.error('Mailgun doména je prázdná');
    return false;
  }

  console.log('Konfigurace Mailgun:', {
    domain: DOMAIN,
    hasApiKey: !!process.env.MAILGUN_API_KEY,
    url: 'https://api.eu.mailgun.net'
  });

  try {
    const data = {
      from: `Aleš Kalina <noreply@${DOMAIN}>`,
      to: email,
      subject: 'Váš přihlašovací odkaz do kurzu',
      text: `
        Dobrý den,

        zde je váš přihlašovací odkaz do kurzu:
        ${loginUrl}

        Odkaz je platný 24 hodin.

        S pozdravem,
        Aleš Kalina
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Váš přihlašovací odkaz do kurzu</h2>
          <p>Dobrý den,</p>
          <p>zde je váš přihlašovací odkaz do kurzu:</p>
          <p style="margin: 20px 0;">
            <a href="${loginUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Přihlásit se
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Odkaz je platný 24 hodin.</p>
          <p style="margin-top: 30px;">S pozdravem,<br>Aleš Kalina</p>
        </div>
      `,
    };

    console.log('Odesílání e-mailu na:', email);
    
    try {
      console.log('Používám Mailgun API klíč:', process.env.MAILGUN_API_KEY ? process.env.MAILGUN_API_KEY.substring(0, 5) + '...' : 'chybí');
      console.log('Používám Mailgun doménu:', DOMAIN);
      
      const result = await mg.messages.create(DOMAIN, data);
      console.log('E-mail byl úspěšně odeslán:', result);
      return true;
    } catch (mailgunError: any) {
      console.error('Chyba při volání Mailgun API:', mailgunError);
      
      // Podrobnější logování chyby
      if (mailgunError.status) {
        console.error('Status chyby:', mailgunError.status);
      }
      if (mailgunError.details) {
        console.error('Detaily chyby:', mailgunError.details);
      }
      if (mailgunError.message) {
        console.error('Zpráva chyby:', mailgunError.message);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Chyba při přípravě e-mailu:', error);
    return false;
  }
}
