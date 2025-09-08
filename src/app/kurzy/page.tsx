import Link from 'next/link';
import CourseImage from '@/components/CourseImage';
import MainLayout from '../MainLayout';
import { FiFilter } from 'react-icons/fi';
import prisma from '@/lib/db';
import { Suspense } from 'react';
import { cookies } from 'next/headers';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isFeatured?: boolean;
  tags?: string[];
  level?: string | null;
  subtitle?: string | null;
}

// Funkce pro načtení kurzů přímo z databáze
async function getCourses(): Promise<Course[]> {
  try {
    const courses = await prisma.course.findMany({
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
        tags: true
      }
    });
    
    return courses;
  } catch (error) {
    console.error('Chyba při načítání kurzů:', error);
    return [];
  }
}

// Funkce pro získání přístupu uživatele ke kurzům přímo z databáze
async function getUserCourseAccess(): Promise<Record<string, boolean>> {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      return {};
    }

    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      
      // Kontrola expirace
      if (sessionData.exp < Math.floor(Date.now() / 1000)) {
        return {};
      }
    } catch (sessionError) {
      return {};
    }

    // Načíst všechny UserCourse záznamy pro tohoto uživatele
    const userCourses = await prisma.userCourse.findMany({
      where: {
        userId: sessionData.userId || sessionData.id,
      },
      select: {
        courseId: true,
      },
    });

    // Vytvořit mapu courseId -> hasAccess
    const courseAccess: Record<string, boolean> = {};
    userCourses.forEach(uc => {
      courseAccess[uc.courseId] = true;
    });

    return courseAccess;
  } catch (error) {
    console.error('Chyba při načítání přístupu ke kurzům:', error);
    return {};
  }
}

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

// Import klientské komponenty
import CoursesWithFilters from '@/components/courses/CoursesWithFilters';

// Server komponenta pro zobrazení kurzů
export default async function Courses() {
  // Získat kurzy a přístup uživatele PARALELNĚ na serveru
  const [courses, userCourseAccess] = await Promise.all([
    getCourses(),
    getUserCourseAccess()
  ]);


  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">Kurzy</h1>
          <p className="text-lg text-neutral-700 text-center max-w-2xl mx-auto mt-4">
            Objevte kurzy, které vám pomohou v osobním rozvoji, pochopení vlastní psychiky a zlepšení kvality života.
          </p>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-12">
        <div className="container-custom">
          <CoursesWithFilters courses={courses} userCourseAccess={userCourseAccess} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Nenašli jste, co hledáte?</h2>
          <p className="text-lg text-neutral-700 mb-8 max-w-2xl mx-auto">
            Kontaktujte mě s vašími dotazy nebo návrhy na nová témata kurzů.
          </p>
          <Link href="/kontakt" prefetch={false} className="btn-outline">
            Kontaktujte mě
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
