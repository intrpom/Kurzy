import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '../../../lib/auth';
import prisma from '../../../lib/db'; // Importujeme sdílenou instanci Prisma klienta

// Označení route jako dynamické, protože používá cookies
export const dynamic = 'force-dynamic';

// GET /api/users - Získání seznamu uživatelů
export async function GET(request: NextRequest) {
  try {
    // Ověření, zda je uživatel přihlášen jako admin
    const session = await verifySession(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nemáte oprávnění k zobrazení uživatelů' }, { status: 403 });
    }

    // Získání parametrů pro stránkování
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Zajistíme čerstvé připojení před dotazy
    try {
      await prisma.$connect();
    } catch (connectError) {
      console.error('Chyba při připojování k databázi:', connectError);
      await prisma.$disconnect();
      await prisma.$connect();
    }

    // Získání celkového počtu uživatelů
    const totalUsers = await prisma.user.count();

    // Získání seznamu uživatelů s jejich kurzy
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      include: {
        userCourses: {
          include: {
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformace dat pro odpověď
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      coursesCount: user.userCourses.length,
      courses: user.userCourses.map(uc => ({
        id: uc.courseId,
        title: uc.course.title,
        slug: uc.course.slug,
        progress: uc.progress,
        completed: uc.completed,
      })),
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error('Chyba při získávání uživatelů:', error);
    return NextResponse.json({ error: 'Nepodařilo se získat seznam uživatelů' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/users - Smazání uživatele
export async function DELETE(request: NextRequest) {
  try {
    // Ověření, zda je uživatel přihlášen jako admin
    const session = await verifySession(request);
    
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nemáte oprávnění k mazání uživatelů' }, { status: 403 });
    }

    // Získání ID uživatele k smazání
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Chybí ID uživatele' }, { status: 400 });
    }

    // Kontrola, zda se admin nesnaží smazat sám sebe
    if (session.userId === userId) {
      return NextResponse.json({ error: 'Nemůžete smazat svůj vlastní účet' }, { status: 400 });
    }

    // Ověření, že uživatel existuje s retry logikou
    let userToDelete;
    try {
      // Zajistíme čerstvé připojení
      await prisma.$connect();
      
      userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCourses: true,
          tokens: true,
        },
      });
    } catch (connectionError) {
      console.error('Chyba při připojení k databázi:', connectionError);
      // Zkusíme znovu s novým připojením
      await prisma.$disconnect();
      await prisma.$connect();
      
      userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCourses: true,
          tokens: true,
        },
      });
    }

    if (!userToDelete) {
      return NextResponse.json({ 
        error: 'Uživatel nebyl nalezen. Možná už byl smazán nebo má jiné ID.' 
      }, { status: 404 });
    }

    // Smazání všech souvisejících dat uživatele v transakci s timeoutem
    await prisma.$transaction(async (tx) => {
      // Smazání všech kurzů uživatele
      await tx.userCourse.deleteMany({
        where: { userId },
      });

      // Smazání všech autentizačních tokenů uživatele
      await tx.authToken.deleteMany({
        where: { userId },
      });

      // Smazání samotného uživatele
      await tx.user.delete({
        where: { id: userId },
      });
    }, { timeout: 10000 }); // 10 sekund timeout

    console.log(`Admin ${session.email} smazal uživatele ${userToDelete.email} (ID: ${userId})`);

    return NextResponse.json({ 
      success: true, 
      message: `Uživatel ${userToDelete.email} byl úspěšně smazán` 
    });

  } catch (error) {
    console.error('Chyba při mazání uživatele:', error);
    return NextResponse.json({ error: 'Nepodařilo se smazat uživatele' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
