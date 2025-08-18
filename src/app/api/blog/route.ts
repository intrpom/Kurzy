import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

    // Načtení blog postů
    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return NextResponse.json(posts);
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
