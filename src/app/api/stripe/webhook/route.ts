import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { updateUserAfterPurchase } from '@/lib/fluentcrm';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 STRIPE WEBHOOK PŘIJAT');
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.log('❌ Chybí Stripe signatura');
      return NextResponse.json(
        { error: 'Chybí Stripe signatura' },
        { status: 400 }
      );
    }

    // Ověření webhook signatury
    const event = constructWebhookEvent(body, signature);
    console.log(`📨 Událost typu: ${event.type}`);

    // Zpracování události podle typu
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      default:
        console.log(`ℹ️ Nezpracovaná událost: ${event.type}`);
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
    console.log('=== STRIPE WEBHOOK: checkout.session.completed ===');
    console.log('Session ID:', session.id);
    console.log('Customer email:', session.customer_details?.email);
    console.log('Session metadata:', session.metadata);
    
    const { courseId, courseSlug } = session.metadata;
    
    if (!courseId) {
      console.error('Chybí courseId v session metadata');
      return;
    }

    // BEZPEČNOSTNÍ KONTROLA: Ověřit že kurz existuje v naší databázi
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true }
    });

    if (!course) {
      console.log(`🚫 WEBHOOK IGNOROVÁN: Kurz s ID "${courseId}" neexistuje v databázi této aplikace`);
      console.log('=== KONEC WEBHOOK (IGNOROVÁN) ===');
      return;
    }

    console.log(`✅ KURZ OVĚŘEN: ${course.title} (${course.slug})`);

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

    console.log(`✅ Kurz ${courseId} byl úspěšně přidán uživateli ${user.id}`);

    // Přidat uživatele do FluentCRM po nákupu kurzu
    try {
      console.log('🔄 Aktualizuji uživatele v FluentCRM po nákupu kurzu...');
      
      // Použijeme již načtený kurz (máme ho z bezpečnostní kontroly)
      const fluentResponse = await updateUserAfterPurchase(
        user.email,
        course.title,
        course.slug
      );
      
      if (fluentResponse.success) {
        console.log('✅ Uživatel úspěšně aktualizován v FluentCRM po nákupu:', user.email);
      } else {
        console.warn('⚠️ Nepodařilo se aktualizovat uživatele v FluentCRM:', fluentResponse.message);
      }
    } catch (error) {
      console.error('❌ Chyba při aktualizaci FluentCRM po nákupu:', error);
      // Pokračujeme i když se nepodaří aktualizovat CRM - nekritická chyba
    }

    console.log('=== WEBHOOK ÚSPĚŠNĚ ZPRACOVÁN ===');

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
