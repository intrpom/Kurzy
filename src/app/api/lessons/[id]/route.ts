import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/lessons/[id] - Načíst lekci
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

// PUT /api/lessons/[id] - Aktualizovat lekci (BEZ MATERIÁLŮ - zjednodušená verze)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[LESSONS API] Začínám aktualizaci lekce s ID: ${params.id}`);
    console.log(`[LESSONS API] Environment: ${process.env.NODE_ENV}`);
    console.log(`[LESSONS API] Database URL type: ${process.env.NODE_ENV === 'production' ? 'PRISMA_DATABASE_URL' : 'DATABASE_URL'}`);
    
    // Kontrola připojení k databázi
    try {
      await prisma.$connect();
      console.log('[LESSONS API] Připojení k databázi úspěšné');
    } catch (dbError) {
      console.error('[LESSONS API] Chyba při připojování k databázi:', dbError);
      return NextResponse.json(
        { error: 'Nepodařilo se připojit k databázi', details: String(dbError) },
        { status: 500 }
      );
    }
    
    // Přidáme kontrolu, zda nejde o hromadnou aktualizaci nebo smazání lekcí
    if (params.id === 'all' || params.id === '*' || params.id.includes(',')) {
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
      console.log(`[LESSONS API] Přijatá data pro lekci ${params.id}:`, {
        title: data.title,
        duration: data.duration,
        materialsCount: Array.isArray(data.materials) ? data.materials.length : 0
      });
    } catch (parseError) {
      console.error('[LESSONS API] Chyba při parsování dat requestu:', parseError);
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
    
    // Příprava dat pro aktualizaci (BEZ MATERIÁLŮ)
    console.log('[LESSONS API] Připravuji data pro aktualizaci lekce:', {
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      duration: data.duration,
      order: data.order
    });
    
    const updateData = {
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      duration: data.duration !== undefined ? Number(data.duration) : undefined,
      order: data.order !== undefined ? Number(data.order) : undefined,
      completed: data.completed
    };
    
    console.log('[LESSONS API] Data pro aktualizaci lekce:', updateData);
    console.log('[LESSONS API] Duration conversion:', { 
      original: data.duration, 
      converted: Number(data.duration),
      type: typeof data.duration 
    });
    
    // Aktualizace pouze základních údajů lekce
    const updatedLesson = await prisma.lesson.update({
      where: { id: params.id },
      data: updateData
    });
    
    console.log(`Lekce s ID ${params.id} byla úspěšně aktualizována`);
    
    // MATERIÁLY JSOU VYPNUTÉ - zpracovávají se přes hlavní courses API
    console.log('Přeskakuji zpracování materiálů - řeší se přes courses API');
      
    // Načtení kompletní aktualizované lekce s materiály
    const completeLesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: { materials: true }
    });
    
    console.log(`Aktualizace lekce ${params.id} dokončena, vráceno ${completeLesson?.materials?.length || 0} materiálů`);
    return NextResponse.json(completeLesson);
    
  } catch (error) {
    console.error('[LESSONS API] Chyba při aktualizaci lekce:', error);
    
    // Podrobnější informace o chybě
    const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
    console.error('[LESSONS API] Detail chyby:', errorMessage);
    console.error('[LESSONS API] Stack trace:', error instanceof Error ? error.stack : 'Nedostupný');
    console.error('[LESSONS API] Error type:', typeof error);
    console.error('[LESSONS API] Error constructor:', error?.constructor?.name);
    
    return NextResponse.json(
      { 
        error: 'Nepodařilo se aktualizovat lekci',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
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