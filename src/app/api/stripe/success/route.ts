import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { updateUserAfterPurchase } from '@/lib/fluentcrm';

export async function POST(request: NextRequest) {
  try {
    // Ověření autentifikace
    const userSession = await verifySession(request);
    if (!userSession) {
      return NextResponse.json(
        { error: 'Neautorizovaný přístup' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Chybí session ID' },
        { status: 400 }
      );
    }

    // Načtení Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Platba nebyla dokončena' },
        { status: 400 }
      );
    }

    // Získání metadata z session
    const { courseId, customerEmail } = session.metadata as any;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Chybí ID kurzu' },
        { status: 400 }
      );
    }

    // Ověření, že e-mail se shoduje s přihlášeným uživatelem
    if (customerEmail !== userSession.email) {
      return NextResponse.json(
        { error: 'E-mail se neshoduje' },
        { status: 400 }
      );
    }

    // Načtení informací o kurzu
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404 }
      );
    }

    // Debug: Zkontrolujeme userSession
    console.log('userSession pro databázi:', { id: userSession.userId, email: userSession.email });

    // Načteme uživatele z databáze podle emailu jako fallback
    const user = await prisma.user.findUnique({
      where: { email: userSession.email },
      select: { id: true, email: true }
    });

    console.log('Nalezený uživatel:', user);

    if (!user) {
      return NextResponse.json(
        { error: 'Uživatel nebyl nalezen v databázi' },
        { status: 404 }
      );
    }

    // Přidání kurzu uživateli
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

    console.log(`Kurz ${courseId} byl úspěšně přidán uživateli ${user.id} po platbě`);

    // Aktualizovat uživatele v FluentCRM po nákupu kurzu
    try {
      console.log('Aktualizuji uživatele v FluentCRM po nákupu kurzu (success endpoint)...');
      
      const fluentResponse = await updateUserAfterPurchase(
        user.email,
        course.title,
        course.slug
      );
      
      if (fluentResponse.success) {
        console.log('Uživatel úspěšně aktualizován v FluentCRM po nákupu (success):', user.email);
      } else {
        console.warn('Nepodařilo se aktualizovat uživatele v FluentCRM (success):', fluentResponse.message);
      }
    } catch (error) {
      console.error('Chyba při aktualizaci FluentCRM po nákupu (success):', error);
      // Pokračujeme i když se nepodaří aktualizovat CRM - nekritická chyba
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      message: 'Kurz byl úspěšně přidán do vašeho účtu'
    });

  } catch (error) {
    console.error('Chyba při zpracování úspěšné platby:', error);
    return NextResponse.json(
      { error: 'Chyba při zpracování platby' },
      { status: 500 }
    );
  }
}
