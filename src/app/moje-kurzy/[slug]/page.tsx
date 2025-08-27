import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Course } from '@/types/course';
import { prisma } from '@/lib/prisma';
import CoursePageClient from '@/components/courses/CoursePageClient';

/**
 * Server-side stránka kurzu pro přihlášené uživatele
 * Načítá kurz přímo z databáze a předává data client komponentě
 */

interface CoursePageProps {
  params: { slug: string };
}

// Načte kurz z databáze a ověří přístup uživatele
async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    // Získat session cookie
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log('❌ Chybí session cookie');
      return null;
    }
    
    // Dekódovat session cookie
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      console.log('❌ Neplatná session');
      return null;
    }
    
    if (!sessionData || !sessionData.id) {
      console.log('❌ Neplatná session data');
      return null;
    }
    
    const userId = sessionData.id;
    
    // Najít kurz podle slugu
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                materials: true
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!course) {
      console.log('❌ Kurz nebyl nalezen:', slug);
      return null;
    }
    
    // Zkontrolovat přístup uživatele ke kurzu
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: userId,
        courseId: course.id
      }
    });
    
    if (!userCourse) {
      console.log('❌ Uživatel nemá přístup ke kurzu:', { userId, courseId: course.id });
      return null;
    }
    
    console.log('✅ Server-side: Kurz načten úspěšně bez API:', { courseId: course.id, title: course.title });
    
    // Transformovat data pro frontend (přidat progress informace)
    const courseWithProgress: Course = {
      ...course,
      description: course.description || '',
      imageUrl: course.imageUrl || '',
      subtitle: course.subtitle || undefined,
      videoLibraryId: course.videoLibraryId || undefined,
      level: (course.level as 'beginner' | 'intermediate' | 'advanced') || undefined,
      createdAt: course.createdAt?.toISOString(),
      updatedAt: course.updatedAt?.toISOString(),
      tags: course.tags || [],
      progress: userCourse.progress,
      completed: userCourse.completed,
      modules: course.modules.map(module => ({
        ...module,
        description: module.description || undefined,
        videoLibraryId: module.videoLibraryId || undefined,
        completed: false, // TODO: Vypočítat podle lekcí
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          description: lesson.description || undefined,
          videoUrl: lesson.videoUrl || undefined,
          videoLibraryId: lesson.videoLibraryId || undefined,
          completed: false, // TODO: Načíst z databáze user progress
          materials: lesson.materials?.map(material => ({
            type: material.type as 'pdf' | 'audio' | 'link' | 'text',
            title: material.title,
            url: material.url || undefined,
            content: material.content || undefined
          })) || []
        }))
      }))
    };
    
    return courseWithProgress;
    
  } catch (error) {
    console.error('🔥 Chyba při načítání kurzu z databáze:', error);
    return null;
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const course = await getCourseBySlug(params.slug);
  
  // Pokud kurz nebyl nalezen nebo uživatel nemá přístup
  if (!course) {
    // Zkusíme zjistit, jestli kurz vůbec existuje
    const courseExists = await prisma.course.findUnique({
      where: { slug: params.slug },
      select: { id: true }
    });
    
    if (!courseExists) {
      // Kurz neexistuje -> 404
      notFound();
    } else {
      // Kurz existuje, ale uživatel nemá přístup -> přesměruj na kurzy
      redirect('/kurzy');
    }
  }
  
  // Předat data client komponentě
  return <CoursePageClient course={course} />;
}