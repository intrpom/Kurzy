import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/user/lesson-progress - Označit lekci jako dokončenou
export async function POST(request: NextRequest) {
  try {
    // Získat session cookie
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Uživatel není přihlášen' },
        { status: 401 }
      );
    }
    
    // Dekódovat session cookie
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      console.error('Chyba při dekódování session:', e);
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401 }
      );
    }
    
    if (!sessionData || !sessionData.id) {
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401 }
      );
    }
    
    const userId = sessionData.id;
    
    // Získat data z požadavku
    const { lessonId } = await request.json();
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Chybí ID lekce' },
        { status: 400 }
      );
    }
    
    // Ověřit, že lekce existuje
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    });
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lekce nebyla nalezena' },
        { status: 404 }
      );
    }
    
    // Ověřit, že uživatel má přístup ke kurzu
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: userId,
        courseId: lesson.module.course.id
      }
    });
    
    if (!userCourse) {
      return NextResponse.json(
        { error: 'Uživatel nemá přístup k tomuto kurzu' },
        { status: 403 }
      );
    }
    
    // Uložit nebo aktualizovat postup lekce
    // @ts-ignore - Prisma model exists but TypeScript cache may be outdated
    const lessonProgress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: lessonId
        }
      },
      update: {
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        lessonId: lessonId,
        completed: true,
        completedAt: new Date()
      }
    });
    
    // Přepočítat postup v kurzu
    const courseId = lesson.module.course.id;
    
    // Získat všechny lekce v kurzu
    const allLessonsInCourse = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: courseId
        }
      }
    });
    
    // Získat všechny dokončené lekce uživatele v tomto kurzu
    // @ts-ignore - Prisma model exists but TypeScript cache may be outdated
    const completedLessons = await prisma.userLessonProgress.findMany({
      where: {
        userId: userId,
        lessonId: {
          in: allLessonsInCourse.map(l => l.id)
        },
        completed: true
      }
    });
    
    // Vypočítat procenta
    const totalLessons = allLessonsInCourse.length;
    const completedCount = completedLessons.length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const courseCompleted = progressPercentage === 100;
    
    // Aktualizovat postup kurzu
    await prisma.userCourse.update({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      data: {
        progress: progressPercentage,
        completed: courseCompleted,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Lekce ${lessonId} označena jako dokončená pro uživatele ${userId}`);
    console.log(`📊 Postup kurzu ${courseId}: ${completedCount}/${totalLessons} (${progressPercentage}%)`);
    
    return NextResponse.json({
      success: true,
      lessonProgress: lessonProgress,
      courseProgress: {
        courseId: courseId,
        progress: progressPercentage,
        completed: courseCompleted,
        completedLessons: completedCount,
        totalLessons: totalLessons
      }
    });
    
  } catch (error) {
    console.error('Chyba při ukládání postupu lekce:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se uložit postup lekce' },
      { status: 500 }
    );
  }
}

// GET /api/user/lesson-progress - Získat postup lekcí pro uživatele
export async function GET(request: NextRequest) {
  try {
    // Získat session cookie
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Uživatel není přihlášen' },
        { status: 401 }
      );
    }
    
    // Dekódovat session cookie
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401 }
      );
    }
    
    if (!sessionData || !sessionData.id) {
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401 }
      );
    }
    
    const userId = sessionData.id;
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    
    // Získat postup lekcí
    const whereClause: any = { userId: userId };
    
    if (courseId) {
      // Pokud je zadán courseId, filtrujeme pouze lekce z tohoto kurzu
      const lessonsInCourse = await prisma.lesson.findMany({
        where: {
          module: {
            courseId: courseId
          }
        },
        select: { id: true }
      });
      
      whereClause.lessonId = {
        in: lessonsInCourse.map(l => l.id)
      };
    }
    
    // @ts-ignore - Prisma model exists but TypeScript cache may be outdated
    const lessonProgress = await prisma.userLessonProgress.findMany({
      where: whereClause,
      select: {
        lessonId: true,
        completed: true,
        completedAt: true
      }
    });
    
    // Převést na mapu pro rychlý přístup
    const progressMap: Record<string, { completed: boolean; completedAt: string }> = {};
    lessonProgress.forEach((progress: { lessonId: string; completed: boolean; completedAt: Date }) => {
      progressMap[progress.lessonId] = {
        completed: progress.completed,
        completedAt: progress.completedAt.toISOString()
      };
    });
    
    return NextResponse.json({
      success: true,
      lessonProgress: progressMap
    });
    
  } catch (error) {
    console.error('Chyba při získávání postupu lekcí:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se získat postup lekcí' },
      { status: 500 }
    );
  }
}
