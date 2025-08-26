import { NextResponse } from 'next/server';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Inicializace Mailgun klienta
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: 'https://api.mailgun.net',
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string;
  formStartTime?: number;
  mathAnswer?: string;
  mathNum1?: number;
  mathNum2?: number;
  mathOperation?: '+' | '-' | '×';
}

// Rate limiting mapa (v produkci by bylo lepší použít Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Anti-spam validační funkce
function validateAntiSpam(data: any, headers: Headers): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Honeypot kontrola
  if (data.honeypot && data.honeypot.trim() !== '') {
    console.log('🚫 SPAM DETECTED: Honeypot field filled:', data.honeypot);
    errors.push('Detekován spam');
    return { isValid: false, errors };
  }

  // 2. User-Agent kontrola
  const userAgent = headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    console.log('🚫 SPAM DETECTED: Invalid or missing User-Agent:', userAgent);
    errors.push('Neplatný prohlížeč');
    return { isValid: false, errors };
  }

  // 3. Referrer kontrola (měl by být z naší domény)
  const referer = headers.get('referer');
  const allowedDomains = [
    'localhost:3001',
    'localhost:3000', 
    'onlinekurzy.ales-kalina.cz',
    'kurzy-three.vercel.app'
  ];
  
  if (referer) {
    const isValidReferer = allowedDomains.some(domain => referer.includes(domain));
    if (!isValidReferer) {
      console.log('🚫 SPAM DETECTED: Invalid referer:', referer);
      errors.push('Neplatný zdroj požadavku');
      return { isValid: false, errors };
    }
  }

  // 4. Time-based kontrola
  if (data.formStartTime) {
    const timeDiff = Date.now() - data.formStartTime;
    if (timeDiff < 3000) { // Minimálně 3 sekundy
      console.log('🚫 SPAM DETECTED: Form submitted too quickly:', timeDiff, 'ms');
      errors.push('Formulář byl odeslán příliš rychle');
      return { isValid: false, errors };
    }
    if (timeDiff > 1800000) { // Maximálně 30 minut
      console.log('🚫 SPAM DETECTED: Form submitted too late:', timeDiff, 'ms');
      errors.push('Formulář byl otevřený příliš dlouho');
      return { isValid: false, errors };
    }
  }

  return { isValid: true, errors: [] };
}

// Math CAPTCHA validační funkce
function validateMathCaptcha(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Kontrola existence všech potřebných dat
  if (!data.mathAnswer || !data.mathNum1 || !data.mathNum2 || !data.mathOperation) {
    console.log('🚫 MATH CAPTCHA: Chybí data pro validaci');
    errors.push('Chybí bezpečnostní otázka');
    return { isValid: false, errors };
  }

  // Parsování odpovědi uživatele
  const userAnswer = parseInt(data.mathAnswer, 10);
  if (isNaN(userAnswer)) {
    console.log('🚫 MATH CAPTCHA: Neplatná odpověď:', data.mathAnswer);
    errors.push('Bezpečnostní otázka musí obsahovat číslo');
    return { isValid: false, errors };
  }

  // Výpočet správné odpovědi
  let correctAnswer: number;
  const { mathNum1, mathNum2, mathOperation } = data;

  switch (mathOperation) {
    case '+':
      correctAnswer = mathNum1 + mathNum2;
      break;
    case '-':
      correctAnswer = mathNum1 - mathNum2;
      break;
    case '×':
      correctAnswer = mathNum1 * mathNum2;
      break;
    default:
      console.log('🚫 MATH CAPTCHA: Neplatná operace:', mathOperation);
      errors.push('Neplatná bezpečnostní otázka');
      return { isValid: false, errors };
  }

  // Kontrola správnosti odpovědi
  if (userAnswer !== correctAnswer) {
    console.log(`🚫 MATH CAPTCHA: Špatná odpověď. ${mathNum1} ${mathOperation} ${mathNum2} = ${correctAnswer}, ale uživatel odpověděl: ${userAnswer}`);
    errors.push(`Nesprávná odpověď na bezpečnostní otázku. ${mathNum1} ${mathOperation} ${mathNum2} = ?`);
    return { isValid: false, errors };
  }

  console.log(`✅ MATH CAPTCHA: Správná odpověď! ${mathNum1} ${mathOperation} ${mathNum2} = ${userAnswer}`);
  return { isValid: true, errors: [] };
}

// Rate limiting funkce
function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minut
  const maxRequests = 5; // Maximálně 5 zpráv za 10 minut

  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit) {
    // První požadavek od této IP
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (now > userLimit.resetTime) {
    // Reset okna
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (userLimit.count >= maxRequests) {
    console.log('🚫 RATE LIMIT EXCEEDED for IP:', ip, 'Count:', userLimit.count);
    return { allowed: false, resetTime: userLimit.resetTime };
  }

  // Zvýšit počítadlo
  userLimit.count++;
  rateLimitMap.set(ip, userLimit);
  return { allowed: true };
}

// Validační funkce
function validateContactForm(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Jméno je povinné a musí mít alespoň 2 znaky');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('E-mail je povinný');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('E-mail není ve správném formátu');
    }
  }

  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length < 3) {
    errors.push('Předmět je povinný a musí mít alespoň 3 znaky');
  }

  if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 10) {
    errors.push('Zpráva je povinná a musí mít alespoň 10 znaků');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Funkce pro odeslání notifikačního emailu
async function sendNotificationEmail(formData: ContactFormData): Promise<boolean> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Chybí Mailgun API klíč nebo doména');
    return false;
  }

  try {
    const emailData = {
      from: `Kontaktní formulář <noreply@${DOMAIN}>`,
      to: 'zeptejtese@aleskalina.cz',
      subject: `Nová zpráva z kontaktního formuláře Kurzy: ${formData.subject}`,
      text: `
        Nová zpráva z kontaktního formuláře Kurzy na webu:

        Jméno: ${formData.name}
        E-mail: ${formData.email}
        Předmět: ${formData.subject}

        Zpráva:
        ${formData.message}

        ---
        Tato zpráva byla odeslána z kontaktního formuláře na ${process.env.NEXT_PUBLIC_BASE_URL || 'onlinekurzy.ales-kalina.cz'}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            📩 Nová zpráva z kontaktního formuláře Kurzy
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-top: 0;">Údaje odesílatele:</h3>
            <p><strong>Jméno:</strong> ${formData.name}</p>
            <p><strong>E-mail:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
            <p><strong>Předmět:</strong> ${formData.subject}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Zpráva:</h3>
            <p style="white-space: pre-wrap;">${formData.message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 14px;">
            <p>Tato zpráva byla odeslána z kontaktního formuláře na 
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://onlinekurzy.ales-kalina.cz'}" style="color: #4F46E5;">
                ${process.env.NEXT_PUBLIC_BASE_URL || 'onlinekurzy.ales-kalina.cz'}
              </a>
            </p>
          </div>
        </div>
      `,
      'h:Reply-To': formData.email
    };

    console.log('Odesílání notifikačního emailu na: zeptejtese@aleskalina.cz');
    const result = await mg.messages.create(DOMAIN, emailData);
    console.log('Notifikační email byl úspěšně odeslán:', result);
    return true;
  } catch (error) {
    console.error('Chyba při odesílání notifikačního emailu:', error);
    return false;
  }
}

// Funkce pro odeslání potvrzovacího emailu uživateli
async function sendConfirmationEmail(formData: ContactFormData): Promise<boolean> {
  try {
    const emailData = {
      from: `Aleš Kalina <noreply@${DOMAIN}>`,
      to: formData.email,
      subject: 'Potvrzení přijetí vaší zprávy',
      text: `
        Dobrý den ${formData.name},

        děkuji za vaši zprávu s předmětem "${formData.subject}".

        Vaše zpráva byla úspěšně odeslána a brzy se vám ozvu s odpovědí.

        S pozdravem,
        Aleš Kalina
        
        ---
        Toto je automatická odpověď. Prosím neodpovídejte na tento e-mail.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2 style="color: #333;">Děkuji za vaši zprávu!</h2>
          
          <p>Dobrý den <strong>${formData.name}</strong>,</p>
          
          <p>děkuji za vaši zprávu s předmětem "<em>${formData.subject}</em>".</p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✅ Vaše zpráva byla úspěšně odeslána a brzy se vám ozvu s odpovědí.</strong></p>
          </div>
          
          <p style="margin-top: 30px;">S pozdravem,<br><strong>Aleš Kalina</strong></p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 14px;">
            <p>Toto je automatická odpověď. Prosím neodpovídejte na tento e-mail.</p>
          </div>
        </div>
      `
    };

    console.log('Odesílání potvrzovacího emailu na:', formData.email);
    const result = await mg.messages.create(DOMAIN, emailData);
    console.log('Potvrzovací email byl úspěšně odeslán:', result);
    return true;
  } catch (error) {
    console.error('Chyba při odesílání potvrzovacího emailu:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    console.log('=== KONTAKTNÍ FORMULÁŘ API ===');
    
    // Získání IP adresy
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    console.log('Request IP:', ip);
    console.log('User-Agent:', request.headers.get('user-agent'));
    console.log('Referer:', request.headers.get('referer'));

    // Rate limiting kontrola
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      console.log('🚫 RATE LIMIT EXCEEDED for IP:', ip);
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleTimeString() : 'neznámý';
      return NextResponse.json(
        { 
          success: false, 
          message: `Příliš mnoho požadavků. Zkuste to znovu po ${resetTime}.`
        },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    console.log('Přijatá data:', { ...body, honeypot: body.honeypot ? '[HIDDEN]' : undefined });

    // Anti-spam kontroly
    const antiSpamValidation = validateAntiSpam(body, request.headers);
    if (!antiSpamValidation.isValid) {
      console.log('🚫 ANTI-SPAM CHYBY:', antiSpamValidation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Požadavek byl odmítnut z bezpečnostních důvodů.' 
        },
        { status: 403 }
      );
    }

    // Math CAPTCHA validace
    const mathValidation = validateMathCaptcha(body);
    if (!mathValidation.isValid) {
      console.log('🚫 MATH CAPTCHA CHYBY:', mathValidation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Chyby v bezpečnostní otázce', 
          errors: mathValidation.errors 
        },
        { status: 400 }
      );
    }

    // Validace dat
    const validation = validateContactForm(body);
    if (!validation.isValid) {
      console.log('Validační chyby:', validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Chyby ve formuláři', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const formData: ContactFormData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      subject: body.subject.trim(),
      message: body.message.trim()
    };

    // Odeslání notifikačního emailu
    const notificationSent = await sendNotificationEmail(formData);
    if (!notificationSent) {
      console.error('Nepodařilo se odeslat notifikační email');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Chyba při odesílání zprávy. Zkuste to prosím později.' 
        },
        { status: 500 }
      );
    }

    // Odeslání potvrzovacího emailu (neblokuje celý proces, pokud selže)
    const confirmationSent = await sendConfirmationEmail(formData);
    if (!confirmationSent) {
      console.warn('Nepodařilo se odeslat potvrzovací email uživateli');
    }

    console.log('=== KONTAKTNÍ FORMULÁŘ ÚSPĚŠNĚ ZPRACOVÁN ===');
    
    return NextResponse.json({
      success: true,
      message: 'Zpráva byla úspěšně odeslána. Brzy se vám ozvu!'
    });

  } catch (error) {
    console.error('Chyba při zpracování kontaktního formuláře:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Došlo k neočekávané chybě. Zkuste to prosím později.' 
      },
      { status: 500 }
    );
  }
}
