import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Batch-save endpoint pro hromadné ukládání kurzu, modulů a lekcí v jedné transakci
 * Tento endpoint výrazně zrychluje ukládání komplexních kurzů s mnoha moduly a lekcemi
 * tím, že eliminuje potřebu sekvenčních API volání pro každý objekt
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Začínám hromadnou aktualizaci kurzu s ID: ${params.id}`);
    
    // Kontrola připojení k databázi
    try {
      await prisma.$connect();
      console.log('Připojení k databázi úspěšné');
    } catch (dbError) {
      console.error('Chyba při připojování k databázi:', dbError);
      return NextResponse.json(
        { error: 'Nepodařilo se připojit k databázi', details: String(dbError) },
        { status: 500 }
      );
    }
    
    // Parsování dat z requestu
    let data;
    try {
      data = await request.json();
      console.log('Přijata data pro hromadné uložení kurzu:', { 
        id: params.id, 
        title: data.title,
        modulesCount: Array.isArray(data.modules) ? data.modules.length : 0
      });
    } catch (parseError) {
      console.error('Chyba při parsování dat requestu:', parseError);
      return NextResponse.json(
        { error: 'Neplatný formát dat', details: String(parseError) },
        { status: 400 }
      );
    }
    
    // Ověření existence kurzu
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.id }
    });
    
    if (!existingCourse) {
      console.error(`Kurz s ID ${params.id} nebyl nalezen`);
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404 }
      );
    }
    
    // Příprava dat pro aktualizaci kurzu
    const courseUpdateData = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      imageUrl: data.imageUrl,
      price: data.price !== undefined ? Number(data.price) : undefined,
      isFeatured: data.isFeatured,
      level: data.level,
      tags: Array.isArray(data.tags) ? data.tags : [],
      progress: data.progress !== undefined ? Number(data.progress) : undefined,
      completed: data.completed
    };
    
    // Provedeme vše v jedné transakci
    try {
      console.log('Začínám transakci pro hromadnou aktualizaci');
      const startTime = Date.now();
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Aktualizace kurzu
        const updatedCourse = await tx.course.update({
          where: { id: params.id },
          data: courseUpdateData
        });
        console.log(`Kurz ${params.id} aktualizován v transakci`);
        
        // 2. Aktualizace modulů
        if (Array.isArray(data.modules)) {
          for (const module of data.modules) {
            // Aktualizace modulu
            await tx.module.update({
              where: { id: module.id },
              data: {
                title: module.title,
                description: module.description,
                order: module.order,
                completed: module.completed
              }
            });
            
            // 3. Aktualizace lekcí pro tento modul
            if (Array.isArray(module.lessons)) {
              for (const lesson of module.lessons) {
                // Aktualizace lekce
                await tx.lesson.update({
                  where: { id: lesson.id },
                  data: {
                    title: lesson.title,
                    description: lesson.description,
                    duration: lesson.duration,
                    videoUrl: lesson.videoUrl,
                    order: lesson.order,
                    completed: lesson.completed
                  }
                });
                
                // 4. Aktualizace materiálů pro tuto lekci
                if (Array.isArray(lesson.materials)) {
                  // Nejprve smažeme všechny existující materiály pro tuto lekci
                  await tx.material.deleteMany({
                    where: { lessonId: lesson.id }
                  });
                  
                  // Poté vytvoříme nové materiály
                  for (const material of lesson.materials) {
                    await tx.material.create({
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
              }
            }
          }
        }
        
        return updatedCourse;
      }, { timeout: 15000 }); // Zvýšení časového limitu transakce na maximum povolené pro Prisma Accelerate (15 sekund)
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Hromadná aktualizace kurzu dokončena za ${duration}ms`);
      return NextResponse.json({
        success: true,
        course: result,
        duration: duration
      });
    } catch (txError) {
      console.error('Chyba při transakci:', txError);
      return NextResponse.json(
        { 
          error: 'Nepodařilo se aktualizovat kurz a jeho komponenty',
          details: txError instanceof Error ? txError.message : String(txError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Chyba při hromadné aktualizaci kurzu:', error);
    // Podrobnější informace o chybě
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detail chyby:', errorMessage);
    if (errorStack) console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Nepodařilo se hromadně aktualizovat kurz',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    // Odpojení od databáze
    await prisma.$disconnect();
  }
}
