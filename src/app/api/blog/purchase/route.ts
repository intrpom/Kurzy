import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Ověření autentifikace (volitelné - nepřihlášení uživatelé mohou také nakupovat)
    const userSession = await verifySession(request);
    console.log('Blog purchase - uživatel:', userSession ? 'přihlášen' : 'nepřihlášen');
    console.log('E-mail uživatele pro Stripe:', userSession?.email || 'žádný');

    const body = await request.json();
    const { blogPostId, blogPostSlug } = body;

    // Validace dat
    if (!blogPostId || !blogPostSlug) {
      return NextResponse.json(
        { error: 'Chybí povinná data' },
        { status: 400 }
      );
    }

    // Získání informací o blog postu
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { 
        id: true, 
        slug: true, 
        title: true, 
        price: true, 
        isPaid: true,
        isPublished: true 
      }
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post nebyl nalezen' },
        { status: 404 }
      );
    }

    if (!blogPost.isPublished) {
      return NextResponse.json(
        { error: 'Blog post není publikován' },
        { status: 400 }
      );
    }

    if (!blogPost.isPaid || blogPost.price === 0) {
      return NextResponse.json(
        { error: 'Tento blog post je zdarma' },
        { status: 400 }
      );
    }

    // Kontrola, zda uživatel už nemá přístup
    if (userSession) {
      const existingAccess = await prisma.userMiniCourse.findFirst({
        where: {
          userId: userSession.userId,
          blogPostId: blogPost.id
        }
      });

      if (existingAccess) {
        return NextResponse.json(
          { error: 'Už máte přístup k tomuto minikurzu' },
          { status: 400 }
        );
      }
    }

    // Vytvoření Checkout Session
    const result = await createCheckoutSession({
      courseId: blogPost.id, // Použijeme stejnou strukturu jako u kurzů
      courseSlug: blogPost.slug,
      courseTitle: `Blog: ${blogPost.title}`,
      price: blogPost.price,
      customerEmail: userSession?.email,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/purchase/success?session_id={CHECKOUT_SESSION_ID}&blog_post_id=${blogPost.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${blogPost.slug}`,
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
    console.error('Chyba při vytváření Stripe checkout pro blog:', error);
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}
