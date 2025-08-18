import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/courses - Získat všechny kurzy
export async function GET(request: NextRequest) {
  try {
    console.log('API: Začínám zpracovávat požadavek GET /api/courses');
    
    // Kontrola připojení k databázi
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('API: Připojení k databázi je funkční');
    } catch (dbError) {
      console.error('API: Chyba při testování připojení k databázi:', dbError);
      return NextResponse.json(
        { error: 'Nepodařilo se připojit k databázi', details: String(dbError) },
        { status: 500 }
      );
    }
    
    // Zjistíme, zda požadujeme detailní data nebo jen základní přehled
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';
    console.log('API: Požadavek na detailní data:', includeDetails);
    
    let courses;
    
    if (includeDetails) {
      // Pokud potřebujeme detailní data (pro admin apod.)
      console.log('API: Načítám kurzy s detaily (moduly, lekce, materiály)');
      courses = await prisma.course.findMany({
        include: {
          modules: {
            orderBy: {
              order: 'asc'
            },
            include: {
              lessons: {
                orderBy: {
                  order: 'asc'
                },
                include: {
                  materials: true
                }
              }
            }
          }
        }
      });
    } else {
      // Pro přehled kurzů stačí základní informace bez modulů, lekcí a materiálů
      console.log('API: Načítám základní informace o kurzech');
      courses = await prisma.course.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          description: true,
          imageUrl: true,
          price: true,
          isFeatured: true,
          level: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }
    
    console.log(`API: Úspěšně načteno ${courses.length} kurzů`);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('API: Chyba při načítání kurzů:', error);
    return NextResponse.json(
      { 
        error: 'Nepodařilo se načíst kurzy', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/courses - Vytvořit nový kurz
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Vytvoření nového kurzu s prázdným polem modulů
    const course = await prisma.course.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price || 0,
        isFeatured: data.isFeatured || false,
        level: data.level,
        tags: data.tags || []
      },
      include: {
        modules: {
          orderBy: {
            order: 'asc'
          },
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              },
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Chyba při vytváření kurzu:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit kurz' },
      { status: 500 }
    );
  }
}
