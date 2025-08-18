import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/lessons - Vytvořit novou lekci
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Zjistíme nejvyšší pořadí lekce v modulu
    const highestOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId: data.moduleId },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = highestOrderLesson ? highestOrderLesson.order + 1 : 1;
    
    // Vytvoření nové lekce
    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        duration: data.duration || 0,
        videoUrl: data.videoUrl,
        order: nextOrder,
        moduleId: data.moduleId
      }
    });
    
    // Pokud jsou k dispozici materiály, vytvoříme je
    if (data.materials && data.materials.length > 0) {
      for (const material of data.materials) {
        await prisma.material.create({
          data: {
            title: material.title,
            type: material.type,
            url: material.url,
            content: material.content,
            lessonId: lesson.id
          }
        });
      }
    }
    
    // Načtení kompletní lekce s materiály
    const completeLesson = await prisma.lesson.findUnique({
      where: { id: lesson.id },
      include: { materials: true }
    });
    
    return NextResponse.json(completeLesson, { status: 201 });
  } catch (error) {
    console.error('Chyba při vytváření lekce:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit lekci' },
      { status: 500 }
    );
  }
}
