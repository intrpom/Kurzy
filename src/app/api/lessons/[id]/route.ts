import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/lessons/[id] - Získat jednu lekci podle ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        materials: true
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekce nebyla nalezena' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Chyba při načítání lekce:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se načíst lekci' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons/[id] - Aktualizovat lekci
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Začínám aktualizaci lekce s ID: ${params.id}`);
    
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
    
    // Přidáme kontrolu, zda nejde o hromadnou aktualizaci nebo smazání lekcí
    const url = new URL(request.url);
    if (url.searchParams.has('bulk') && url.searchParams.get('bulk') === 'true') {
      console.error('Detekován pokus o hromadnou aktualizaci lekcí - tato operace není povolena');
      return NextResponse.json(
        { error: 'Hromadné aktualizace lekcí nejsou povoleny z bezpečnostních důvodů' },
        { status: 403 }
      );
    }
    
    // Parsování dat z requestu
    let data;
    try {
      data = await request.json();
      console.log('Data lekce k aktualizaci:', { 
        id: params.id, 
        title: data.title,
        materialsCount: Array.isArray(data.materials) ? data.materials.length : 0
      });
    } catch (parseError) {
      console.error('Chyba při parsování dat requestu:', parseError);
      return NextResponse.json(
        { error: 'Neplatný formát dat', details: String(parseError) },
        { status: 400 }
      );
    }
    
    // Ověření existence lekce
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: params.id }
    });
    
    if (!existingLesson) {
      console.error(`Lekce s ID ${params.id} nebyla nalezena`);
      return NextResponse.json(
        { error: 'Lekce nebyla nalezena' },
        { status: 404 }
      );
    }
    
    // Příprava dat pro aktualizaci
    console.log('Přijatá data z requestu:', {
      title: data.title,
      videoUrl: data.videoUrl,
      videoLibraryId: data.videoLibraryId,
      duration: data.duration,
      order: data.order
    });
    
    const updateData = {
      title: data.title,
      description: data.description,
      duration: data.duration !== undefined ? Number(data.duration) : undefined,
      videoUrl: data.videoUrl,
      videoLibraryId: data.videoLibraryId,
      order: data.order !== undefined ? Number(data.order) : undefined,
      completed: data.completed
    };
    
    console.log('Data pro aktualizaci lekce:', updateData);
    
    console.log('Připravená data pro aktualizaci lekce:', updateData);
    
    // Aktualizace lekce v transakci spolu s materiály
    try {
      // Aktualizace lekce
      const updatedLesson = await prisma.lesson.update({
        where: { id: params.id },
        data: updateData
      });
      
      console.log(`Lekce s ID ${params.id} byla úspěšně aktualizována`);
      
      // Pokud jsou k dispozici materiály, aktualizujeme je
      // Podrobné logování pro debugování problému s materiály
      console.log(`Typ dat.materials:`, typeof data.materials);
      console.log(`Data.materials hodnota:`, data.materials);
      console.log(`Celý objekt data:`, JSON.stringify(data, null, 2));
      console.log(`Request headers:`, JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
      
      // Pokud je materials string (JSON), pokusíme se ho parsovat
      let materialsArray = data.materials;
      if (typeof data.materials === 'string') {
        try {
          console.log('Pokouším se parsovat materials jako JSON string');
          materialsArray = JSON.parse(data.materials);
          console.log('Parsování úspěšné, materials je nyní:', materialsArray);
        } catch (parseError) {
          console.error('Chyba při parsování materials jako JSON:', parseError);
        }
      }
      
      if (Array.isArray(materialsArray)) {
        console.log(`Aktualizuji ${materialsArray.length} materiálů pro lekci ${params.id}`);
        console.log(`Detailní výpis materiálů:`, JSON.stringify(materialsArray, null, 2));
        
        // Načteme existující materiály
        const existingMaterials = await prisma.material.findMany({
          where: { lessonId: params.id }
        });
        console.log(`Nalezeno ${existingMaterials.length} existujících materiálů`);
        
        // Zpracujeme materiály v transakci pro zajištění konzistence dat
        await prisma.$transaction(async (tx) => {
          // Vytvoříme seznam ID materiálů, které chceme zachovat
          const newMaterialIds = materialsArray
            .filter(m => m.id) // Filtrujeme pouze materiály s ID
            .map(m => m.id);
          
          // Smažeme pouze materiály, které již nejsou v novém seznamu
          const materialsToDelete = existingMaterials.filter(
            existingMat => !newMaterialIds.includes(existingMat.id)
          );
          
          if (materialsToDelete.length > 0) {
            console.log(`Mažu ${materialsToDelete.length} nepotřebných materiálů`);
            await tx.material.deleteMany({
              where: {
                id: { in: materialsToDelete.map(m => m.id) }
              }
            });
          }
          
          // Zpracujeme každý materiál - aktualizujeme existující nebo vytvoříme nové
          for (const material of materialsArray) {
            try {
              console.log(`Zpracovávám materiál:`, {
                id: material.id || 'nový',
                title: material.title,
                type: material.type,
                url: material.url?.substring(0, 50) + (material.url?.length > 50 ? '...' : ''),
                contentLength: material.content?.length || 0
              });
              
            
              // Kontrola, zda máme platné URL pro PDF materiál
              if (material.type === 'pdf' && (!material.url || material.url.trim() === '')) {
                console.error(`Chyba: Materiál typu PDF nemá nastavenou URL:`, material);
                continue; // Přeskočíme tento materiál
              }
              
              if (material.id) {
                // Aktualizujeme existující materiál
                const updatedMaterial = await tx.material.update({
                  where: { id: material.id },
                  data: {
                    title: material.title,
                    type: material.type,
                    url: material.url,
                    content: material.content
                  }
                });
                console.log(`Materiál úspěšně aktualizován s ID: ${updatedMaterial.id}`);
              } else {
                // Vytvoříme nový materiál
                const createdMaterial = await tx.material.create({
                  data: {
                    title: material.title,
                    type: material.type,
                    url: material.url,
                    content: material.content,
                    lessonId: params.id
                  }
                });
                console.log(`Materiál úspěšně vytvořen s ID: ${createdMaterial.id}`);
              }
            } catch (materialError) {
              console.error(`Chyba při zpracování materiálu '${material.title}':`, materialError);
              // Pokračujeme s dalšími materiály i když jeden selže
            }
          }
        });
      }
      
      // Načtení kompletní aktualizované lekce s materiály
      const completeLesson = await prisma.lesson.findUnique({
        where: { id: params.id },
        include: { materials: true }
      });
      
      console.log(`Aktualizace lekce ${params.id} dokončena, vráceno ${completeLesson?.materials?.length || 0} materiálů`);
      return NextResponse.json(completeLesson);
    } catch (updateError) {
      console.error('Chyba při aktualizaci lekce nebo materiálů:', updateError);
      throw updateError; // Předáme chybu do hlavního catch bloku
    }
  } catch (error) {
    console.error('Chyba při aktualizaci lekce:', error);
    // Podrobnější informace o chybě
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detail chyby:', errorMessage);
    if (errorStack) console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Nepodařilo se aktualizovat lekci',
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

// DELETE /api/lessons/[id] - Smazat lekci
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lesson.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chyba při mazání lekce:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se smazat lekci' },
      { status: 500 }
    );
  }
}
