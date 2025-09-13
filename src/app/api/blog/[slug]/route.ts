import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// Povolení veřejného přístupu k blog API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// CORS headers pro veřejný přístup
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS handler pro CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// GET /api/blog/[slug] - Načíst jeden blog post podle slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Optimalizace: Kombinace načtení a update v jednom volání
    const post = await prisma.blogPost.update({
      where: {
        slug: params.slug
      },
      data: {
        views: { increment: 1 }
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        content: true,
        videoUrl: true,
        videoLibraryId: true,
        thumbnailUrl: true,
        tags: true,
        isPublished: true,
        views: true,
        duration: true,
        price: true,
        isPaid: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Kontrola přístupu pro přihlášené uživatele
    let hasAccess = false;
    try {
      const sessionCookie = cookies().get('session');
      
      if (sessionCookie) {
        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
        const userId = sessionData?.id;
        const userRole = sessionData?.role;
        
        if (userId) {
          // Admin má přístup ke všemu
          if (userRole === 'ADMIN') {
            hasAccess = true;
          }
          // Pro placené posty zkontrolovat přístup v UserMiniCourse
          else if (post.isPaid && post.price > 0) {
            const userMiniCourse = await prisma.userMiniCourse.findFirst({
              where: {
                userId: userId,
                blogPostId: post.id
              }
            });
            hasAccess = !!userMiniCourse;
          } else {
            // Bezplatné posty - má přístup každý přihlášený
            hasAccess = true;
          }
        }
      }
    } catch (sessionError) {
      // Ignorujeme chyby session - uživatel prostě není přihlášen
      console.log('Session error (ignorováno):', sessionError);
    }

    // Přidáme informaci o přístupu k odpovědi
    const postWithAccess = {
      ...post,
      hasAccess: hasAccess || !post.isPaid || post.price === 0
    };

    return NextResponse.json(postWithAccess, {
      headers: corsHeaders(),
    });
  } catch (error) {
    // Pokud post neexistuje, update selže s P2025 - zkusíme jen načtení
    if (error instanceof Error && error.message.includes('P2025')) {
      return NextResponse.json(
        { error: 'Blog post nebyl nalezen' },
        { status: 404 }
      );
    }
    
    console.error('Chyba při načítání blog postu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst blog post' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/[slug] - Aktualizovat blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await request.json();
    
    const post = await prisma.blogPost.update({
      where: {
        slug: params.slug
      },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        videoUrl: data.videoUrl,
        videoLibraryId: data.videoLibraryId,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags,
        isPublished: data.isPublished,
        duration: data.duration,
        price: data.price,
        isPaid: data.isPaid,
        // Pokud se mění slug, aktualizuj i ten
        ...(data.slug && data.slug !== params.slug ? { slug: data.slug } : {})
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Chyba při aktualizaci blog postu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se aktualizovat blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[slug] - Smazat blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await prisma.blogPost.delete({
      where: {
        slug: params.slug
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při mazání blog postu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se smazat blog post' },
      { status: 500 }
    );
  }
}
