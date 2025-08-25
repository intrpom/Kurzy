import Stripe from 'stripe';

// Stripe instance - vytvoří se až runtime
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-07-30.basil',
    });
  }
  return stripeInstance;
}

// Stripe klíče
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Typy pro Stripe
export interface StripeCheckoutData {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  price: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

// Funkce pro vytvoření Checkout Session
export async function createCheckoutSession(data: StripeCheckoutData) {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: data.courseTitle,
              description: `Kurz: ${data.courseTitle}`,
            },
            unit_amount: data.price * 100, // Stripe používá centy
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: data.customerEmail, // Předvyplní e-mail v Stripe formuláři
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        courseId: data.courseId,
        courseSlug: data.courseSlug,
        customerEmail: data.customerEmail || '', // Přidáme e-mail do metadata pro webhook
      },
    });

    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Chyba při vytváření Stripe session:', error);
    return { success: false, error: 'Nepodařilo se vytvořit platební session' };
  }
}

// Funkce pro ověření webhook signatury
export function constructWebhookEvent(payload: string, signature: string) {
  try {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Chyba při ověřování webhook signatury:', error);
    throw new Error('Neplatná webhook signatura');
  }
}
