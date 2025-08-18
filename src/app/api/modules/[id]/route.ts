import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/modules/[id] - Získat jeden modul podle ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const module = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            materials: true
          }
        }
      }
    });
    
    if (!module) {
      return NextResponse.json(
        { error: 'Modul nebyl nalezen' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(module);
  } catch (error) {
    console.error('Chyba při načítání modulu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst modul' },
      { status: 500 }
    );
  }
}

// PUT /api/modules/[id] - Aktualizovat modul včetně lekcí a materiálů
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kontrola připojení k databázi
    try {
      await prisma.$connect();
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
    } catch (parseError) {
      console.error('Chyba při parsování dat requestu:', parseError);
      return NextResponse.json(
        { error: 'Neplatný formát dat', details: String(parseError) },
        { status: 400 }
      );
    }
    
    // Ověření existence modulu
    const existingModule = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        lessons: {
          include: {
            materials: true
          }
        }
      }
    });
    
    if (!existingModule) {
      return NextResponse.json(
        { error: 'Modul nebyl nalezen' },
        { status: 404 }
      );
    }
    
    // Příprava dat pro aktualizaci modulu
    const updateData: any = {
      title: data.title,
      description: data.description,
      order: data.order !== undefined ? Number(data.order) : undefined,
      completed: data.completed
    };
    
    // Přidání videoLibraryId, pokud je zadáno
    if (data.videoLibraryId !== undefined) {
      updateData.videoLibraryId = data.videoLibraryId;
    }
    
    // Transakce pro aktualizaci modulu a všech jeho lekcí
    const result = await prisma.$transaction(async (tx) => {
      // 1. Aktualizace modulu
      const updatedModule = await tx.module.update({
        where: { id: params.id },
        data: updateData
      });
      
      // 2. Aktualizace lekcí a materiálů, pokud jsou součástí dat
      if (data.lessons && Array.isArray(data.lessons)) {
        console.log(`Aktualizuji ${data.lessons.length} lekcí v modulu ${params.id}`);
        
        // Zpracování každé lekce
        for (const lesson of data.lessons) {
          if (!lesson.id) continue;
          
          // Příprava dat pro aktualizaci lekce
          const lessonUpdateData: any = {
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration !== undefined ? Number(lesson.duration) : undefined,
            order: lesson.order !== undefined ? Number(lesson.order) : undefined
          };
          
          // Aktualizace lekce
          const updatedLesson = await tx.lesson.update({
            where: { id: lesson.id },
            data: lessonUpdateData
          });
          
          // Aktualizace materiálů, pokud existují
          if (lesson.materials && Array.isArray(lesson.materials)) {
            // Nejprve smažeme všechny stávající materiály
            await tx.material.deleteMany({
              where: { lessonId: lesson.id }
            });
            
            // Poté vytvoříme nové materiály
            if (lesson.materials.length > 0) {
              await tx.material.createMany({
                data: lesson.materials.map((material: any) => ({
                  type: material.type,
                  title: material.title,
                  url: material.url,
                  content: material.content,
                  lessonId: lesson.id
                }))
              });
            }
          }
        }
      }
      
      // Vrátíme aktualizovaný modul
      return updatedModule;
    });
    
    // Načteme aktualizovaný modul včetně lekcí a materiálů
    const updatedModuleWithLessons = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            materials: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedModuleWithLessons);
  } catch (error) {
    console.error('Chyba při aktualizaci modulu:', error);
    // Podrobnější informace o chybě
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detail chyby:', errorMessage);
    if (errorStack) console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Nepodařilo se aktualizovat modul',
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

// DELETE /api/modules/[id] - Smazat modul
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.module.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při mazání modulu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se smazat modul' },
      { status: 500 }
    );
  }
}
