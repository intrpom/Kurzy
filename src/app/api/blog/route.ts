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

// GET /api/blog - Načíst všechny blog posty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const published = searchParams.get('published') !== 'false'; // default true
    
    // Sestavení WHERE podmínek
    const where: any = {};
    if (published) {
      where.isPublished = true;
    }
    if (tag) {
      where.tags = {
        has: tag
      };
    }

    // Načtení blog postů s optimalizovanými poli
    const posts = await prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
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
        // Nepotřebujeme content pro seznam
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Kontrola přístupu pro přihlášené uživatele - BATCH operace
    let userMiniCourses: string[] = [];
    try {
      const sessionCookie = cookies().get('session');
      if (sessionCookie) {
        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
        const userId = sessionData?.id;
        if (userId) {
          // Jeden dotaz pro všechny přístupy najednou
          const miniCourses = await prisma.userMiniCourse.findMany({
            where: { userId },
            select: { blogPostId: true }
          });
          userMiniCourses = miniCourses.map(mc => mc.blogPostId);
        }
      }
    } catch (sessionError) {
      // Ignorujeme chyby session - uživatel není přihlášen
    }

    // Přidáme hasAccess ke každému postu
    const postsWithAccess = posts.map(post => ({
      ...post,
      hasAccess: !post.isPaid || post.price === 0 || userMiniCourses.includes(post.id)
    }));

    return NextResponse.json(postsWithAccess, {
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error('Chyba při načítání blog postů:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst blog posty' },
      { status: 500 }
    );
  }
}

// POST /api/blog - Vytvořit nový blog post
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Vytvoření nového blog postu
    const post = await prisma.blogPost.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        videoUrl: data.videoUrl,
        videoLibraryId: data.videoLibraryId,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags || [],
        isPublished: data.isPublished !== false, // default true
        duration: data.duration
      }
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Chyba při vytváření blog postu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit blog post' },
      { status: 500 }
    );
  }
}
