import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

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
    
    // Získat courseId z URL parametrů, pokud existuje
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    
    // Pokud je zadán courseId, vrátíme pouze informaci, zda uživatel má přístup k tomuto kurzu
    if (courseId) {
      // Zkontrolovat, zda uživatel má přístup ke kurzu
      // @ts-ignore - Prisma klient má správně definovaný model userCourse
      const userCourse = await prisma.userCourse.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      });
      
      // Uživatel má přístup pouze pokud má kurz přidán ve svých kurzích
      const hasAccess = !!userCourse;
      
      // Pokud uživatel má přístup, vrátíme podrobnější informace o kurzu
      if (hasAccess) {
        return NextResponse.json({
          hasAccess: true,
          courses: [{ 
            id: courseId,
            progress: userCourse.progress,
            completed: userCourse.completed 
          }]
        });
      } else {
        // Pokud uživatel nemá přístup, vrátíme prázdný seznam kurzů
        return NextResponse.json({
          hasAccess: false,
          courses: []
        });
      }
    }
    
    // Získat kurzy uživatele včetně detailů o kurzích
    // @ts-ignore - Prisma klient má správně definovaný model userCourse
    const userCoursesData = await prisma.userCourse.findMany({
      where: {
        userId: userId
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Transformovat data pro frontend
    const formattedCourses = userCoursesData.map((userCourse: any) => {
      // Spočítat celkový počet lekcí
      let totalLessons = 0;
      userCourse.course.modules.forEach((module: any) => {
        totalLessons += module.lessons.length;
      });
      
      // Najít poslední lekci (pro pokračování v kurzu)
      // Toto je zjednodušená implementace - v reálné aplikaci by bylo potřeba
      // sledovat poslední dokončenou lekci pro každého uživatele
      const lastModule = userCourse.course.modules[0];
      const lastLesson = lastModule?.lessons[0];
      
      return {
        id: userCourse.course.id,
        slug: userCourse.course.slug,
        title: userCourse.course.title,
        description: userCourse.course.description,
        imageUrl: userCourse.course.imageUrl,
        progress: userCourse.progress,
        completed: userCourse.completed,
        lessonsCompleted: Math.round(totalLessons * (userCourse.progress / 100)) || 0,
        totalLessons: totalLessons,
        lastLesson: lastLesson ? {
          title: lastLesson.title,
          module: lastModule.title
        } : null
      };
    });
    
    // Získat všechny kurzy, které uživatel nemá
    const allCourses = await prisma.course.findMany({
      where: {
        NOT: {
          id: {
            in: userCoursesData.map((uc: any) => uc.courseId)
          }
        }
      }
    });
    
    // Transformovat data pro frontend
    const availableCourses = allCourses.map((course: Prisma.CourseGetPayload<{}>) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      isFree: course.price === 0
    }));
    
    return NextResponse.json({
      userCourses: formattedCourses,
      availableCourses: availableCourses
    });
  } catch (error) {
    console.error('Chyba při získávání kurzů uživatele:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku' },
      { status: 500 }
    );
  }
}
