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
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Nemáte oprávnění k zobrazení uživatelů' }, { status: 403 });
    }

    // Získání parametrů pro stránkování
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

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
