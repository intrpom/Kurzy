import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/courses/manual-order - Ruční nastavení pořadí lekcí
export async function POST(request: NextRequest) {
  try {
    console.log('Začínám ruční nastavení pořadí lekcí');
    
    const data = await request.json();
    const { courseId, moduleId, lessonOrders } = data;
    
    if (!courseId || !moduleId || !lessonOrders || !Array.isArray(lessonOrders)) {
      return NextResponse.json(
        { error: 'Neplatné parametry požadavku' },
        { status: 400 }
      );
    }
    
    console.log(`Nastavuji pořadí lekcí pro kurz ${courseId}, modul ${moduleId}`);
    console.log('Požadované pořadí:', lessonOrders);
    
    // Získání lekcí v modulu
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: true
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Modul nebyl nalezen' },
        { status: 404 }
      );
    }
    
    // Aktualizace pořadí lekcí
    const updates: Promise<any>[] = [];
    for (const order of lessonOrders) {
      if (!order.id || typeof order.order !== 'number') {
        continue;
      }
      
      console.log(`Nastavuji lekci ${order.id} na pořadí ${order.order}`);
      
      updates.push(
        prisma.lesson.update({
          where: { id: order.id },
          data: { order: order.order }
        })
      );
    }
    
    // Provedení všech aktualizací v transakci
    // Pro pole aktualizací nelze použít timeout přímo, musíme použít callback funkci
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await update;
      }
    }, { timeout: 15000 }); // Zvýšení časového limitu transakce na maximum povolené pro Prisma Accelerate (15 sekund)
    
    // Získání aktualizovaného modulu s lekcemi
    const updatedModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return NextResponse.json({
      message: 'Pořadí lekcí bylo úspěšně aktualizováno',
      module: updatedModule
    });
  } catch (error) {
    console.error('Chyba při nastavování pořadí lekcí:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se nastavit pořadí lekcí', details: String(error) },
      { status: 500 }
    );
  }
}
