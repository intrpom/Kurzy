# API Dokumentace - Online Kurzy

Tato dokumentace popisuje integrace s externími API službami používanými v projektu Online Kurzy.

## Obsah

1. [MailGun API - E-mailové služby](#mailgun-api)
2. [Stripe API - Platební zpracování](#stripe-api)
3. [FluentCRM API - CRM systém](#fluentcrm-api)
4. [Konfigurace proměnných prostředí](#konfigurace)
5. [Implementační příklady](#implementace)

---

## MailGun API

### Přehled
MailGun je použit pro odesílání e-mailů s magic linky pro přihlášení uživatelů.

### Instalace
```bash
npm install mailgun.js form-data
```

### Konfigurace
```typescript
// src/lib/mailgun.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: 'https://api.mailgun.net', // Globální API endpoint
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';
```

### Proměnné prostředí
```env
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=your_domain.com
```

### Použití
```typescript
// Odeslání přihlašovacího e-mailu
export async function sendLoginEmail(email: string, loginUrl: string): Promise<boolean> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Chybí Mailgun API klíč nebo doména');
    return false;
  }

  try {
    const data = {
      from: `Aleš Kalina <noreply@${DOMAIN}>`,
      to: email,
      subject: 'Váš přihlašovací odkaz do kurzu',
      text: `Dobrý den,\n\nzde je váš přihlašovací odkaz do kurzu:\n${loginUrl}\n\nOdkaz je platný 24 hodin.\n\nS pozdravem,\nAleš Kalina`,
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

    const result = await mg.messages.create(DOMAIN, data);
    console.log('E-mail byl úspěšně odeslán:', result);
    return true;
  } catch (error) {
    console.error('Chyba při odesílání e-mailu:', error);
    return false;
  }
}
```

### Nastavení MailGun
1. Vytvořte účet na [MailGun](https://www.mailgun.com/)
2. Ověřte doménu nebo použijte sandbox doménu
3. Získejte API klíč z dashboardu
4. Nastavte proměnné prostředí

---

## Stripe API

### Přehled
Stripe je připraven pro implementaci platebního zpracování, ale aktuálně není implementován.

### Instalace
```bash
npm install stripe @stripe/stripe-js
```

### Konfigurace
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export default stripe;
```

### Proměnné prostředí
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Implementace platebního procesu

#### 1. Vytvoření Payment Intent
```typescript
// src/app/api/payments/create-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { courseId, amount, email } = await request.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe používá centy
      currency: 'czk',
      metadata: {
        courseId,
        email,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Chyba při vytváření Payment Intent:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit platbu' },
      { status: 500 }
    );
  }
}
```

#### 2. Webhook pro zpracování úspěšných plateb
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Chyba při ověřování webhooku:', error);
    return NextResponse.json(
      { error: 'Neplatný webhook' },
      { status: 400 }
    );
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { courseId, email } = paymentIntent.metadata;

    // Přidat kurz uživateli
    try {
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: { email, role: 'user' }
        });
      }

      await prisma.userCourse.create({
        data: {
          userId: user.id,
          courseId,
          progress: 0,
          completed: false
        }
      });

      console.log(`Kurz ${courseId} byl přidán uživateli ${email}`);
    } catch (error) {
      console.error('Chyba při přidávání kurzu uživateli:', error);
    }
  }

  return NextResponse.json({ received: true });
}
```

#### 3. Frontend komponenta pro platby
```typescript
// src/components/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ courseId, amount }: { courseId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Vytvořit Payment Intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, amount }),
      });

      const { clientSecret } = await response.json();

      // Potvrdit platbu
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        console.error('Chyba platby:', result.error);
      } else {
        console.log('Platba úspěšná:', result.paymentIntent);
        // Přesměrovat na potvrzení
      }
    } catch (error) {
      console.error('Chyba při zpracování platby:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={loading}>
        {loading ? 'Zpracování...' : 'Zaplatit'}
      </button>
    </form>
  );
}

export default function PaymentForm({ courseId, amount }: { courseId: string; amount: number }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm courseId={courseId} amount={amount} />
    </Elements>
  );
}
```

---

## FluentCRM API

### Přehled
FluentCRM je WordPress CRM plugin pro správu kontaktů a automatizaci marketingových procesů.

### Konfigurace
```typescript
// src/lib/fluentcrm.ts
const FLUENTCRM_API_URL = process.env.FLUENTCRM_API_URL;
const FLUENTCRM_API_KEY = process.env.FLUENTCRM_API_KEY;

export class FluentCRMClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = FLUENTCRM_API_URL!;
    this.apiKey = FLUENTCRM_API_KEY!;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/wp-json/fluent-crm/v2/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`FluentCRM API error: ${response.status}`);
    }

    return response.json();
  }

  // Přidat kontakt
  async addContact(contactData: {
    email: string;
    first_name?: string;
    last_name?: string;
    tags?: string[];
    lists?: string[];
  }) {
    return this.request('contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  // Aktualizovat kontakt
  async updateContact(contactId: number, contactData: any) {
    return this.request(`contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  // Přidat tag ke kontaktu
  async addTagToContact(contactId: number, tagId: number) {
    return this.request(`contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_id: tagId }),
    });
  }

  // Přidat kontakt do listu
  async addContactToList(contactId: number, listId: number) {
    return this.request(`contacts/${contactId}/lists`, {
      method: 'POST',
      body: JSON.stringify({ list_id: listId }),
    });
  }

  // Spustit automatizaci
  async triggerAutomation(automationId: number, contactId: number) {
    return this.request(`automations/${automationId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId }),
    });
  }
}

export const fluentCRM = new FluentCRMClient();
```

### Proměnné prostředí
```env
FLUENTCRM_API_URL=https://your-wordpress-site.com
FLUENTCRM_API_KEY=your_api_key_here
```

### Použití
```typescript
// Přidání nového uživatele do FluentCRM
export async function addUserToFluentCRM(user: { email: string; name?: string }) {
  try {
    const contact = await fluentCRM.addContact({
      email: user.email,
      first_name: user.name?.split(' ')[0],
      last_name: user.name?.split(' ').slice(1).join(' '),
      tags: ['online-kurzy'],
      lists: ['newsletter'],
    });

    console.log('Uživatel přidán do FluentCRM:', contact);
    return contact;
  } catch (error) {
    console.error('Chyba při přidávání do FluentCRM:', error);
    throw error;
  }
}

// Aktualizace po zakoupení kurzu
export async function updateUserAfterPurchase(email: string, courseName: string) {
  try {
    // Najít kontakt podle e-mailu
    const contacts = await fluentCRM.request(`contacts?search=${email}`);
    const contact = contacts.data[0];

    if (contact) {
      // Přidat tag pro zakoupený kurz
      await fluentCRM.addTagToContact(contact.id, getTagIdForCourse(courseName));
      
      // Spustit automatizaci pro nové zákazníky
      await fluentCRM.triggerAutomation(1, contact.id); // ID automatizace
    }
  } catch (error) {
    console.error('Chyba při aktualizaci v FluentCRM:', error);
  }
}
```

---

## Konfigurace

### Proměnné prostředí (.env)
```env
# MailGun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# FluentCRM
FLUENTCRM_API_URL=https://your-wordpress-site.com
FLUENTCRM_API_KEY=your_fluentcrm_api_key

# Aplikace
NEXT_PUBLIC_BASE_URL=https://your-app.com
JWT_SECRET=your_jwt_secret
```

### Nastavení na Vercel
1. Přejděte do Vercel dashboardu
2. Vyberte projekt
3. Jděte do "Settings" > "Environment Variables"
4. Přidejte všechny potřebné proměnné

---

## Implementace

### Integrace do existujícího kódu

#### 1. Přidání uživatele do FluentCRM při registraci
```typescript
// src/app/api/auth/login/route.ts
import { addUserToFluentCRM } from '@/lib/fluentcrm';

export async function POST(request: NextRequest) {
  // ... existující kód ...

  // Po vytvoření uživatele
  if (!user) {
    user = await prisma.user.create({
      data: { email, role: 'user' }
    });

    // Přidat do FluentCRM
    try {
      await addUserToFluentCRM({ email });
    } catch (error) {
      console.error('Chyba při přidávání do FluentCRM:', error);
      // Pokračujeme i když se nepodaří přidat do CRM
    }
  }

  // ... zbytek kódu ...
}
```

#### 2. Zpracování plateb po úspěšné platbě
```typescript
// src/app/api/webhooks/stripe/route.ts
import { updateUserAfterPurchase } from '@/lib/fluentcrm';

export async function POST(request: NextRequest) {
  // ... existující kód ...

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { courseId, email } = paymentIntent.metadata;

    // Přidat kurz uživateli
    // ... existující kód ...

    // Aktualizovat v FluentCRM
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (course) {
        await updateUserAfterPurchase(email, course.title);
      }
    } catch (error) {
      console.error('Chyba při aktualizaci FluentCRM:', error);
    }
  }

  // ... zbytek kódu ...
}
```

### Testování

#### MailGun
```bash
# Test odeslání e-mailu
curl -X POST http://localhost:3000/api/test/mailgun \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "message": "Test message"}'
```

#### Stripe
```bash
# Test webhooku (použijte Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### FluentCRM
```bash
# Test API připojení
curl -X GET "https://your-site.com/wp-json/fluent-crm/v2/contacts" \
  -H "Authorization: Bearer your_api_key"
```

---

## Bezpečnost

### Doporučení
1. **API klíče**: Nikdy necommitovat API klíče do repozitáře
2. **Webhooky**: Vždy ověřovat podpis webhooků
3. **Rate limiting**: Implementovat omezení rychlosti požadavků
4. **Logging**: Logovat všechny API volání pro debugging
5. **Error handling**: Správně zpracovávat chyby a fallbacky

### Implementace rate limiting
```typescript
// src/lib/rate-limiter.ts
import { NextRequest } from 'next/server';

const requests = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(request: NextRequest, limit: number = 100, windowMs: number = 60000): boolean {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  const userRequests = requests.get(ip);
  
  if (!userRequests || now > userRequests.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userRequests.count >= limit) {
    return false;
  }
  
  userRequests.count++;
  return true;
}
```

---

## Monitoring a Logging

### Implementace loggeru
```typescript
// src/utils/api-logger.ts
export class APILogger {
  static log(service: string, action: string, data: any) {
    console.log(`[${service}] ${action}:`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  static error(service: string, action: string, error: any) {
    console.error(`[${service}] ${action} ERROR:`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
  }
}
```

### Použití v API voláních
```typescript
import { APILogger } from '@/utils/api-logger';

// V MailGun volání
APILogger.log('MailGun', 'send_email', { email, subject });

// V Stripe webhooku
APILogger.log('Stripe', 'payment_succeeded', { paymentIntentId, amount });

// V FluentCRM volání
APILogger.log('FluentCRM', 'add_contact', { email, tags });
```

---

## Troubleshooting

### Časté problémy

#### MailGun
- **Chyba 401**: Neplatný API klíč
- **Chyba 400**: Neověřená doména
- **E-maily nechodí**: Zkontrolujte spam filtry

#### Stripe
- **Webhook nefunguje**: Zkontrolujte webhook URL a secret
- **Platba selhává**: Zkontrolujte testovací karty
- **CORS chyby**: Nastavte správné domény v Stripe dashboardu

#### FluentCRM
- **401 Unauthorized**: Neplatný API klíč
- **404 Not Found**: Špatná URL nebo endpoint
- **Rate limiting**: Zkontrolujte limity API

### Debugging
```typescript
// Přidat do .env pro debugging
DEBUG_API_CALLS=true

// V kódu
if (process.env.DEBUG_API_CALLS) {
  console.log('API call:', { url, method, data });
}
```

---

Tato dokumentace poskytuje kompletní přehled integrací s externími API službami. Pro další informace konzultujte oficiální dokumentace jednotlivých služeb. 