import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/modules - Vytvořit nový modul
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Zjistíme nejvyšší pořadí modulu v kurzu
    const highestOrderModule = await prisma.module.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = highestOrderModule ? highestOrderModule.order + 1 : 1;
    
    // Příprava dat pro vytvoření modulu
    const moduleData: any = {
      title: data.title,
      description: data.description,
      order: nextOrder,
      courseId: data.courseId
    };
    
    // Přidání videoLibraryId, pokud je zadáno
    if (data.videoLibraryId) {
      moduleData.videoLibraryId = data.videoLibraryId;
    }
    
    // Vytvoření nového modulu
    const module = await prisma.module.create({
      data: moduleData
    });
    
    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error('Chyba při vytváření modulu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit modul' },
      { status: 500 }
    );
  }
}
