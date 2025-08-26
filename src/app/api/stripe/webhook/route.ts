import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { updateUserAfterPurchase } from '@/lib/fluentcrm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Chybí Stripe signatura' },
        { status: 400 }
      );
    }

    // Ověření webhook signatury
    const event = constructWebhookEvent(body, signature);

    // Zpracování události podle typu
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      default:
        console.log(`Nezpracovaná událost: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Chyba při zpracování webhook:', error);
    return NextResponse.json(
      { error: 'Chyba při zpracování webhook' },
      { status: 400 }
    );
  }
}

// Zpracování úspěšné platby
async function handleCheckoutCompleted(session: any) {
  try {
    const { courseId, courseSlug } = session.metadata;
    
    if (!courseId) {
      console.error('Chybí courseId v session metadata');
      return;
    }

    // Najít uživatele podle emailu z checkout session
    const user = await prisma.user.findFirst({
      where: { email: session.customer_details?.email }
    });

    if (!user) {
      console.error('Uživatel nenalezen:', session.customer_details?.email);
      return;
    }

    // Přidat kurz uživateli
    await prisma.userCourse.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
      update: {
        progress: 0,
        completed: false,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        courseId: courseId,
        progress: 0,
        completed: false,
      },
    });

    console.log(`Kurz ${courseId} byl úspěšně přidán uživateli ${user.id}`);

    // Přidat uživatele do FluentCRM po nákupu kurzu
    try {
      console.log('Aktualizuji uživatele v FluentCRM po nákupu kurzu...');
      
      // Najít informace o kurzu
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, slug: true }
      });

      if (course) {
        const fluentResponse = await updateUserAfterPurchase(
          user.email,
          course.title,
          course.slug
        );
        
        if (fluentResponse.success) {
          console.log('Uživatel úspěšně aktualizován v FluentCRM po nákupu:', user.email);
        } else {
          console.warn('Nepodařilo se aktualizovat uživatele v FluentCRM:', fluentResponse.message);
        }
      } else {
        console.warn('Kurz nenalezen pro FluentCRM aktualizaci:', courseId);
      }
    } catch (error) {
      console.error('Chyba při aktualizaci FluentCRM po nákupu:', error);
      // Pokračujeme i když se nepodaří aktualizovat CRM - nekritická chyba
    }

  } catch (error) {
    console.error('Chyba při zpracování checkout.completed:', error);
  }
}

// Zpracování úspěšné platby (fallback)
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Tady můžeme přidat další logiku pro zpracování platby
    console.log('Payment succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Chyba při zpracování payment.succeeded:', error);
  }
}
