import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
      }
    });

    return NextResponse.json(post, {
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
