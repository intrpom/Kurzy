import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/courses/slug/[slug] - Získat kurz podle slugu
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Chyba při načítání kurzu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst kurz' },
      { status: 500 }
    );
  }
}
