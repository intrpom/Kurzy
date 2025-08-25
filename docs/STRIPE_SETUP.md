# Stripe Setup Guide

## 🚀 **Instalace a konfigurace Stripe**

### **1. Instalace balíčků**
```bash
npm install stripe @stripe/stripe-js
```

### **2. Stripe účet a klíče**
1. Vytvořte účet na [stripe.com](https://stripe.com)
2. Získejte API klíče z Dashboard → Developers → API keys
3. Vytvořte webhook endpoint

### **3. Environment proměnné**
Vytvořte `.env.local` soubor:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Test secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Test publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook secret

# Base URL pro redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **4. Webhook nastavení**
1. V Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Zkopírujte webhook secret do `.env.local`

### **5. Testování**
- Použijte test karty: `4242 4242 4242 4242`
- Expiry: libovolná budoucí data
- CVC: libovolné 3 číslice

## 🔧 **Implementované funkce**

### **API Endpoints:**
- `POST /api/stripe/checkout` - Vytvoření checkout session
- `POST /api/stripe/webhook` - Zpracování webhook událostí

### **Komponenty:**
- `BuyCourseButton` - Stripe checkout pro placené kurzy
- `PaymentConfirmationPage` - Stránka po úspěšné platbě

### **Automatické akce:**
- Po úspěšné platbě se kurz automaticky přidá uživateli
- Uživatel je přesměrován na potvrzení platby
- Progress tracking začíná od 0

## 📱 **Použití**

### **Pro placené kurzy:**
```tsx
<CourseAccessButton 
  courseId="course-123"
  slug="nazev-kurzu"
  price={1500} // Cena v Kč
/>
```

### **Stripe Checkout flow:**
1. Uživatel klikne "Koupit kurz"
2. Vytvoří se Stripe Checkout session
3. Uživatel je přesměrován na Stripe
4. Po platbě se vrátí na `/platba/potvrzeni`
5. Webhook zpracuje platbu a přidá kurz

## 🛡️ **Bezpečnost**

- Webhook signatury jsou ověřovány
- API endpoints vyžadují autentifikaci
- Metadata obsahuje courseId pro identifikaci
- Error handling pro všechny operace

## 🔄 **Další kroky**

1. **Produkční klíče** - Změňte test klíče na produkční
2. **Email notifikace** - Přidejte potvrzení o platbě
3. **Refund handling** - Implementujte vrácení peněz
4. **Subscription** - Přidejte měsíční předplatné
5. **Analytics** - Sledování konverzí a platby
