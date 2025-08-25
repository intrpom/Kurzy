import Link from 'next/link';
import CourseImage from '@/components/CourseImage';
import MainLayout from '../MainLayout';
import { FiFilter } from 'react-icons/fi';
import prisma from '@/lib/db';
import { Suspense } from 'react';

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
    
    // Debug: vypíšeme ceny kurzů s timestampem
    const timestamp = new Date().toISOString();
    
    return courses;
  } catch (error) {
    console.error('Chyba při načítání kurzů:', error);
    return [];
  }
}

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

// Import klientské komponenty
import CourseCard from './CourseCard';

// Server komponenta pro zobrazení kurzů
export default async function Courses() {
  const courses = await getCourses();

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
          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <FiFilter className="mr-2 text-neutral-600" />
              <span className="font-medium">Filtrovat:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm">
                Všechny
              </button>
              <button className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-full text-sm hover:bg-neutral-50">
                Zdarma
              </button>
              <button className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-full text-sm hover:bg-neutral-50">
                Placené
              </button>
              <button className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-full text-sm hover:bg-neutral-50">
                Mindfulness
              </button>
              <button className="px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-full text-sm hover:bg-neutral-50">
                Osobní rozvoj
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course: Course, index: number) => (
              <CourseCard key={course.id} course={course} priority={index === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Nenašli jste, co hledáte?</h2>
          <p className="text-lg text-neutral-700 mb-8 max-w-2xl mx-auto">
            Kontaktujte mě s vašimi dotazy nebo návrhy na nová témata kurzů.
          </p>
          <Link href="/kontakt" className="btn-outline">
            Kontaktujte mě
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
