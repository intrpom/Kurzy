# FluentCRM API Komunikace - Kompletní dokumentace

Tento dokument popisuje detailní proces komunikace s FluentCRM API v projektu.

## 📋 Konfigurace FluentCRM API

### Environment Variables
```env
FLUENTCRM_API_URL=https://vase-domena.cz/wp-json/fluent-crm/v2
FLUENTCRM_API_USERNAME=vase_username
FLUENTCRM_API_PASSWORD=vase_password
```

## 🔐 Autentizace

**Typ:** Basic Authentication
```typescript
const authToken = Buffer.from(`${username}:${password}`).toString('base64');

// Headers pro všechny requesty:
{
  'Authorization': `Basic ${authToken}`,
  'Content-Type': 'application/json'
}
```

## 📡 API Endpointy a Volání

### 1. Hledání kontaktu podle emailu

**Endpoint:** `GET /subscribers?search={email}`

```typescript
// Příklad volání z src/app/api/get-contact/route.ts
const searchUrl = `${apiUrl}/subscribers?search=${encodeURIComponent(email)}`;

const response = await fetch(searchUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json'
  }
});
```

**Struktura odpovědi:**
```json
{
  "subscribers": {
    "data": [
      {
        "id": 123,
        "email": "user@example.com",
        "first_name": "Jan",
        "last_name": "Novák"
      }
    ]
  }
}
```

### 2. Získání detailů kontaktu

**Endpoint:** `GET /subscribers/{id}?with[]=custom_values&with[]=subscriber.custom_values`

```typescript
// Z src/app/api/get-contact/route.ts
const detailUrl = `${apiUrl}/subscribers/${contactId}?with[]=custom_values&with[]=subscriber.custom_values`;

const detailResponse = await fetch(detailUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Vytvoření nového kontaktu

**Endpoint:** `POST /subscribers`

```typescript
// Struktura dat pro vytvoření kontaktu
const contactData = {
  email: "user@example.com",
  first_name: "Jan",
  last_name: "Novák",
  status: "subscribed",
  source: "stripe_payment",
  custom_values: {
    score: "35",
    archetyp: "tichy-trpitel",
    score_group: "tiche_odcizeni",
    clicked_offer: "Ano",
    utm_source: "facebook",
    utm_medium: "cpc"
  },
  tags: ["minikurz_paid"]
};

const response = await fetch(`${apiUrl}/subscribers`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contactData)
});
```

### 4. Update existujícího kontaktu

**Endpoint:** `PUT /subscribers/{id}`

```typescript
const updateData = {
  custom_values: {
    clicked_offer: "Ano",
    offer_expiry_timestamp: "1640995200000"
  }
};

const response = await fetch(`${apiUrl}/subscribers/${contactId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

## 🎯 Hlavní API Route Soubory

### `/api/get-contact` - Získání kontaktu
**Soubor:** `src/app/api/get-contact/route.ts`
- **Metoda:** POST
- **Parametry:** `{ email: string }`
- **Proces:** Hledá kontakt → Získává detaily → Vrací kompletní data

```typescript
// Příklad použití
const response = await fetch('/api/get-contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const data = await response.json();
if (data.success && data.contact) {
  console.log('Kontakt nalezen:', data.contact);
}
```

### `/api/check-email-in-crm` - Kontrola existence emailu
**Soubor:** `src/app/api/check-email-in-crm/route.ts`
- **Metoda:** POST  
- **Parametry:** `{ email: string, listId?: number }`
- **Proces:** Ověřuje, zda email existuje v CRM

```typescript
// Příklad použití
const checkResponse = await fetch('/api/check-email-in-crm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const { exists, contact } = await checkResponse.json();
```

### `/api/get-crm-data` - Obecné CRM data
**Soubor:** `src/app/api/get-crm-data/route.ts`
- **Metoda:** GET
- **Query parametry:** `resource`, `action`, `id`
- **Podporované zdroje:** contacts, tags, lists, custom-fields, forms

```typescript
// Příklady volání
GET /api/get-crm-data?resource=contacts&action=get
GET /api/get-crm-data?resource=contacts&action=get&id=123
GET /api/get-crm-data?resource=tags&action=get
```

### `/api/update-segments` - Hromadná aktualizace
**Soubor:** `src/app/api/update-segments/route.ts`
- **Metoda:** POST
- **Účel:** Hromadná aktualizace score_group a motivation polí

```typescript
// Příklad volání
const updateResponse = await fetch('/api/update-segments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    batchSize: 10, 
    page: 1 
  })
});
```

## 🔄 Webhook komunikace

### Webhook URL
```typescript
// Pro odesílání dat přes webhook (z src/lib/fluentcrm.ts)
const webhookUrl = 'https://ales-kalina.cz/?fluentcrm=1&route=contact&hash=67459a0b-dabd-4f67-8060-587e56369f02';

// Struktura dat pro webhook
const dataToSend = {
  first_name: "Jan",
  last_name: "Novák", 
  email: "user@example.com",
  source: "stripe_payment",
  status: "subscribed",
  utm_source: "facebook",
  utm_medium: "cpc",
  custom_values: {
    clicked_offer: "Ano",
    score: "35"
  },
  tags: ["minikurz_paid"]
};

// Odeslání na webhook
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(dataToSend)
});
```

## 🎨 React Hook pro CRM data

### useFluentCRM Hook
**Soubor:** `src/hooks/useFluentCRM.ts`

```typescript
// Používání v komponentě
import { useFluentCRM } from '@/hooks/useFluentCRM';

function MyComponent() {
  const { 
    contact, 
    loading, 
    error, 
    clearCache, 
    offerDeadline, 
    refreshContact,
    inList1005 
  } = useFluentCRM("user@example.com");

  if (loading) return <div>Načítám...</div>;
  if (error) return <div>Chyba: {error}</div>;
  if (!contact) return <div>Kontakt nenalezen</div>;

  return (
    <div>
      <h1>{contact.first_name} {contact.last_name}</h1>
      <p>{contact.email}</p>
      {offerDeadline && (
        <p>Nabídka vyprší: {offerDeadline.toLocaleString()}</p>
      )}
    </div>
  );
}
```

**Vlastnosti hook:**
- **Cache systém** s 1 minutou expirací
- **Automatické retry** při chybách (max 3 pokusy)
- **Optimistic loading**
- **Hydration safety** pro SSR
- **Timeout handling** (10 sekund)

## ⚙️ Mapování endpointů

```typescript
// Z src/app/api/get-crm-data/route.ts
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
```

## 📊 Typy a Interfaces

### FluentCRM Data Types
```typescript
// src/lib/types.ts
export interface FluentCRMSubscriberData {
  email: string;
  status: string;
  first_name?: string;
  last_name?: string;
  lists?: number[];
  custom_values?: Record<string, string | number | boolean | null | undefined>;
  tags?: (string | number)[];
}

export interface FluentCRMData {
  subscriber: FluentCRMSubscriberData;
}

export interface FluentCRMResponse {
  ok: boolean;
  status?: number;
  error?: string;
  data?: Record<string, unknown> | string;
}
```

### Hook Types
```typescript
// src/hooks/useFluentCRM.ts
interface FluentCRMContact {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  custom_values?: Record<string, any>;
  tags?: string[];
  lists?: any[];
  inList1005?: boolean;
}

interface UseFluentCRMReturn {
  contact: FluentCRMContact | null;
  loading: boolean;
  error: string | null;
  clearCache: (email?: string) => void;
  offerDeadline: Date | null;
  refreshContact: () => void;
  inList1005: boolean;
}
```

## 🛡️ Error Handling

Všechny API volání obsahují:

### Timeout handling
```typescript
// 8-10 sekund timeout pro všechna volání
fetch(url, {
  signal: AbortSignal.timeout(8000) // 8 sekund
});
```

### Retry logika
```typescript
// Z useFluentCRM hook
if (retryCountRef.current < maxRetries) {
  retryCountRef.current++;
  const delay = Math.min(500 * retryCountRef.current, 2000); // Max 2 sekundy
  setTimeout(() => {
    fetchContact();
  }, delay);
}
```

### Proper error responses
```typescript
// Standardní error response
return NextResponse.json({ 
  success: false,
  error: 'Popis chyby' 
}, { status: 400 });
```

### Logging
```typescript
// Použití logger utils
import { logInfo, logError, logDebug } from '@/utils/logger';

logInfo('=== ZAČÁTEK KONTROLY EMAILU V CRM ===');
logError('Chyba při komunikaci s FluentCRM API:', response.statusText);
```

## 🔄 Kompletní Flow Example

### Od testu po FluentCRM
```typescript
// 1. Uživatel dokončí test
const testResults = {
  score: 35,
  archetyp_url_slug: 'tichy-trpitel',
  skore_group: 'tiche_odcizeni'
};

// 2. Kontrola existence kontaktu
const checkResponse = await fetch('/api/check-email-in-crm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const { exists, contact } = await checkResponse.json();

// 3a. Pokud kontakt existuje - update
if (exists) {
  // Update přes PUT /subscribers/{id}
  const updateData = {
    custom_values: {
      ...contact.custom_values,
      score: testResults.score.toString(),
      archetyp: testResults.archetyp_url_slug,
      score_group: testResults.skore_group
    }
  };
}

// 3b. Pokud kontakt neexistuje - vytvoření
if (!exists) {
  // Vytvoření přes POST /subscribers nebo webhook
  const fluentCRMData = {
    subscriber: {
      email: 'user@example.com',
      first_name: 'Jan',
      last_name: 'Novák',
      status: 'subscribed',
      tags: ['test_completed'],
      custom_values: {
        score: testResults.score.toString(),
        archetyp: testResults.archetyp_url_slug,
        score_group: testResults.skore_group
      }
    }
  };
  
  // Odeslání přes webhook
  await sendDataToFluentCRM(fluentCRMData);
}

// 4. Načtení aktualizovaných dat
const { contact: updatedContact } = useFluentCRM('user@example.com');
```

## 📝 Důležité poznámky

1. **FluentCRM API verze:** v2 (`/wp-json/fluent-crm/v2`)
2. **Autentizace:** Basic Auth s username/password
3. **Custom fields:** Přenášejí se v `custom_values` objektu
4. **Tagy:** Mohou být string nebo number array
5. **Cache:** 1 minuta expirace pro optimální performance
6. **Retry:** Max 3 pokusy s exponential backoff
7. **Webhook vs REST:** Projekt používá oba přístupy podle situace

## 🚨 Troubleshooting

### Časté problémy:

1. **401 Unauthorized**: Zkontroluj API credentials
2. **Timeout**: Zkontroluj síťové připojení a API URL
3. **Contact not found**: Email neexistuje v CRM nebo má jiný formát
4. **Custom fields not saving**: Zkontroluj názvy custom fields v CRM
5. **Cache issues**: Použij `clearCache()` nebo `refreshContact()`

### Debug tipy:

```typescript
// Zapnutí debug logů
if (process.env.NODE_ENV === 'development') {
  console.log('API volání:', { url, headers, body });
}

// Kontrola odpovědi
console.log('FluentCRM odpověď:', await response.json());
```

Tato dokumentace pokrývá všechny aspekty komunikace s FluentCRM API v projektu včetně praktických příkladů a error handling.
