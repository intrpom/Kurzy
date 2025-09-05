import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';

// GET /api/courses/[id] - Získat jeden kurz podle ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
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

// PUT /api/courses/[id] - Aktualizovat kurz
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Začínám aktualizaci kurzu s ID: ${params.id}`);
    
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
      console.log('Data kurzu k aktualizaci:', { 
        id: params.id, 
        slug: data.slug, 
        title: data.title 
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
      where: { id: params.id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    });
    
    if (!existingCourse) {
      console.error(`Kurz s ID ${params.id} nebyl nalezen`);
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404 }
      );
    }
    
    // Příprava dat pro aktualizaci
    const updateData = {
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
      completed: data.completed,
      videoLibraryId: data.videoLibraryId || null
    };
    
    console.log('Připravená data pro aktualizaci:', updateData);
    console.log('Tagy k uložení:', { 
      input: data.tags, 
      processed: updateData.tags,
      isArray: Array.isArray(data.tags),
      length: Array.isArray(data.tags) ? data.tags.length : 'N/A'
    });
    
    // Optimalizovaná aktualizace kurzu s batch operacemi
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // 1. Aktualizace základních údajů kurzu
      const course = await tx.course.update({
        where: { id: params.id },
        data: updateData,
      });
      
      // 2. Zpracování modulů - optimalizované batch operace
      // Pokud se neposílají moduly nebo jsou prázdné, PŘESKOČÍME zpracování
      if (Array.isArray(data.modules) && data.modules.length > 0) {
        console.log(`Zpracovávám ${data.modules.length} modulů`);
        
        // ZDE bude celá logika pro zpracování modulů
        const existingModuleIds = existingCourse.modules.map((m: any) => m.id);
        const newModuleIds = data.modules.map((m: any) => m.id);
        
        // Batch smazání modulů - pouze pokud explicitně neexistují v nových datech
        const modulesToDelete = existingModuleIds.filter(id => !newModuleIds.includes(id));
        if (modulesToDelete.length > 0) {
          console.log(`Mažu moduly: ${modulesToDelete.join(', ')}`);
          await tx.module.deleteMany({
            where: { id: { in: modulesToDelete } }
          });
        }
        
        // Připravit data pro batch operace
        const modulesToUpdate = [];
        const modulesToCreate = [];
        const lessonsToUpdate = [];
        const lessonsToCreate = [];
        const lessonsToDelete = [];
        
        for (const moduleData of data.modules) {
          const moduleExists = existingModuleIds.includes(moduleData.id);
          const moduleUpdateData = {
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order,
            completed: moduleData.completed || false,
            courseId: params.id,
            videoLibraryId: moduleData.videoLibraryId || null
          };
          
          if (moduleExists) {
            modulesToUpdate.push({ id: moduleData.id, data: moduleUpdateData });
          } else {
            modulesToCreate.push({ id: moduleData.id, ...moduleUpdateData });
          }
          
          // Zpracování lekcí
          // Pokud se neposílají lekce, zachováme existující
          if (!Array.isArray(moduleData.lessons)) {
            const existingModule = existingCourse.modules.find((m: any) => m.id === moduleData.id);
            if (existingModule) {
              moduleData.lessons = existingModule.lessons || [];
              console.log(`Zachovávám ${moduleData.lessons.length} existujících lekcí pro modul ${moduleData.title}`);
            }
          }
          
          if (Array.isArray(moduleData.lessons)) {
            const existingLessons = existingCourse.modules
              .find((m: any) => m.id === moduleData.id)?.lessons || [];
            const existingLessonIds = existingLessons.map((l: any) => l.id);
            const newLessonIds = moduleData.lessons.map((l: any) => l.id);
            
            console.log(`Modul ${moduleData.title}: ${existingLessons.length} existujících lekcí, ${moduleData.lessons.length} nových`);
            
            // Lekce ke smazání
            const moduleDeleteLessons = existingLessonIds.filter(id => !newLessonIds.includes(id));
            if (moduleDeleteLessons.length > 0) {
              console.log(`Mažu lekce: ${moduleDeleteLessons.join(', ')}`);
            }
            lessonsToDelete.push(...moduleDeleteLessons);
            
            for (const lessonData of moduleData.lessons) {
              const lessonExists = existingLessonIds.includes(lessonData.id);
              const lessonUpdateData = {
                title: lessonData.title,
                description: lessonData.description,
                duration: lessonData.duration !== undefined ? Number(lessonData.duration) : 0,
                videoUrl: lessonData.videoUrl,
                order: lessonData.order !== undefined ? Number(lessonData.order) : 0,
                completed: lessonData.completed || false,
                moduleId: moduleData.id,
                videoLibraryId: lessonData.videoLibraryId || null
              };
              
              if (lessonExists) {
                lessonsToUpdate.push({ id: lessonData.id, data: lessonUpdateData });
              } else {
                lessonsToCreate.push({ id: lessonData.id, ...lessonUpdateData });
              }
            }
          }
        }
        
        // Batch operace pro moduly
        for (const moduleUpdate of modulesToUpdate) {
          await tx.module.update({
            where: { id: moduleUpdate.id },
            data: moduleUpdate.data
          });
        }
        
        if (modulesToCreate.length > 0) {
          await tx.module.createMany({
            data: modulesToCreate
          });
        }
        
        // Batch operace pro lekce
        if (lessonsToDelete.length > 0) {
          await tx.lesson.deleteMany({
            where: { id: { in: lessonsToDelete } }
          });
        }
        
        for (const lessonUpdate of lessonsToUpdate) {
          await tx.lesson.update({
            where: { id: lessonUpdate.id },
            data: lessonUpdate.data
          });
        }
        
        if (lessonsToCreate.length > 0) {
          await tx.lesson.createMany({
            data: lessonsToCreate
          });
        }
        
        // Zpracování materiálů pro všechny lekce
        console.log('Zpracovávám materiály pro všechny lekce...');
        for (const moduleData of data.modules) {
          if (Array.isArray(moduleData.lessons)) {
            for (const lessonData of moduleData.lessons) {
              if (Array.isArray(lessonData.materials)) {
                console.log(`Lekce ${lessonData.title}: zpracovávám ${lessonData.materials.length} materiálů`);
                
                // Načteme existující materiály pro tuto lekci
                const existingMaterials = await tx.material.findMany({
                  where: { lessonId: lessonData.id }
                });
                
                // Vytvoříme seznam ID materiálů, které chceme zachovat
                const newMaterialIds = lessonData.materials
                  .filter((m: any) => m.id)
                  .map((m: any) => m.id);
                
                // Smažeme materiály, které již nejsou v novém seznamu
                const materialsToDelete = existingMaterials.filter(
                  existingMat => !newMaterialIds.includes(existingMat.id)
                );
                
                if (materialsToDelete.length > 0) {
                  console.log(`Mažu ${materialsToDelete.length} nepotřebných materiálů pro lekci ${lessonData.title}`);
                  await tx.material.deleteMany({
                    where: {
                      id: { in: materialsToDelete.map(m => m.id) }
                    }
                  });
                }
                
                // Zpracujeme každý materiál
                for (const material of lessonData.materials) {
                  try {
                    if (material.id) {
                      // Aktualizace existujícího materiálu
                      await tx.material.update({
                        where: { id: material.id },
                        data: {
                          title: material.title,
                          type: material.type,
                          url: material.url,
                          content: material.content
                        }
                      });
                    } else {
                      // Vytvoření nového materiálu
                      await tx.material.create({
                        data: {
                          title: material.title,
                          type: material.type,
                          url: material.url,
                          content: material.content,
                          lessonId: lessonData.id
                        }
                      });
                    }
                  } catch (materialError) {
                    console.error(`Chyba při zpracování materiálu '${material.title}':`, materialError);
                    // Pokračujeme s dalšími materiály
                  }
                }
              }
            }
          }
        }
      } else {
        console.log('Moduly se neposílají nebo jsou prázdné - PŘESKAKUJI zpracování a zachovávám existující');
      }
      
      // Načtení aktualizovaného kurzu s moduly a lekcemi
      return tx.course.findUnique({
        where: { id: params.id },
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
    }, { timeout: 30000 }); // Zvýšení timeoutu pro velké kurzy s mnoha lekcemi
    
    console.log(`Kurz s ID ${params.id} byl úspěšně aktualizován včetně modulů a lekcí`);
    
    // Automatické vymazání cache po úspěšné aktualizaci kurzu
    try {
      revalidatePath('/kurzy');
      revalidatePath(`/kurzy/${data.slug}`);
      revalidatePath('/');
      revalidatePath('/moje-kurzy');
      console.log('Cache byla automaticky vymazána po aktualizaci kurzu');
    } catch (revalidateError) {
      console.error('Chyba při vymazávání cache:', revalidateError);
      // Pokračujeme i když se nepodaří vymazat cache
    }
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Chyba při aktualizaci kurzu:', error);
    // Podrobnější informace o chybě
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detail chyby:', errorMessage);
    if (errorStack) console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Nepodařilo se aktualizovat kurz',
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

// DELETE /api/courses/[id] - Smazat kurz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.course.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při mazání kurzu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se smazat kurz' },
      { status: 500 }
    );
  }
}
