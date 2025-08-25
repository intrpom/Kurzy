import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Ověření autentifikace (volitelné - nepřihlášení uživatelé mohou také nakupovat)
    const userSession = await verifySession(request);
    console.log('Stripe checkout - uživatel:', userSession ? 'přihlášen' : 'nepřihlášen');
    console.log('E-mail uživatele pro Stripe:', userSession?.email || 'žádný');

    const body = await request.json();
    const { courseId, courseSlug, courseTitle, price } = body;

    // Validace dat
    if (!courseId || !courseSlug || !courseTitle || price === undefined) {
      return NextResponse.json(
        { error: 'Chybí povinná data' },
        { status: 400 }
      );
    }

    // Vytvoření Checkout Session
    const result = await createCheckoutSession({
      courseId,
      courseSlug,
      courseTitle,
      price,
      customerEmail: userSession?.email, // Předáme e-mail přihlášeného uživatele
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/platba/potvrzeni?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/kurzy/${courseSlug}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
    });

  } catch (error) {
    console.error('Chyba při vytváření Stripe checkout:', error);
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}
