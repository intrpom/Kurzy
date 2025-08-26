'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkCourseAccess } from '@/api/userCourses';
import CourseImage from '@/components/CourseImage';
import CourseAccessButton from '@/components/courses/CourseAccessButton';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  subtitle?: string | null;
  isFeatured?: boolean;
  tags?: string[];
  level?: string | null;
}

interface CourseCardProps {
  course: Course;
  priority?: boolean;
}

export default function CourseCard({ course, priority = false }: CourseCardProps) {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(false);

  // Kontrola, zda má uživatel přístup ke kurzu
  useEffect(() => {
    const fetchCourseAccess = async () => {
      // Pokud není uživatel přihlášen, nemá přístup
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);
        
        const { hasAccess: userHasAccess } = await checkCourseAccess(course.id);
        setHasAccess(userHasAccess);
      } catch (error) {
        console.error('Chyba při kontrole přístupu ke kurzu:', error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (user && !loading) {
      fetchCourseAccess();
    } else if (!loading) {
      setHasAccess(false);
    }
  }, [user, loading, course.id]);

  return (
    <div className="card">
      <div className="relative">
        {course.imageUrl ? (
          <div className="w-full">
            <CourseImage 
              src={course.imageUrl} 
              alt={course.title}
              width={400}
              height={225}
              className="w-full h-auto rounded-t-lg"
              priority={priority}
            />
          </div>
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-400">Bez obrázku</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-secondary-500 text-white text-sm font-medium px-2 py-1 rounded">
          {course.price === 0 ? 'Zdarma' : `${course.price} Kč`}
        </div>
      </div>
      <div className="p-6 flex flex-col justify-between min-h-[200px]">
        <div>
          <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
          <p className="text-neutral-700 mb-4">
            {course.subtitle || course.description.substring(0, 120) + '...'}
          </p>
        </div>
        <div>
          {course.price === 0 ? (
            // Pro kurzy zdarma - stále používáme CourseAccessButton
            <CourseAccessButton 
              courseId={course.id}
              slug={course.slug}
              price={Number(course.price)}
            />
          ) : (
            // Pro placené kurzy - kontrolujeme přístup uživatele
            <>
              {loading || checkingAccess ? (
                // Loading stav
                <button className="btn-primary inline-flex items-center justify-center w-full opacity-75 cursor-wait" disabled>
                  Načítání...
                </button>
              ) : user && hasAccess ? (
                // Uživatel má přístup ke kurzu - "Zahájit kurz"
                <Link 
                  href={`/moje-kurzy/${course.slug}`}
                  className="btn-primary inline-flex items-center justify-center w-full"
                >
                  Zahájit kurz <FiArrowRight className="ml-2" />
                </Link>
              ) : (
                // Uživatel nemá přístup - "Detail kurzu"
                <Link 
                  href={`/kurzy/${course.slug}`}
                  className="btn-primary inline-flex items-center justify-center w-full"
                >
                  Detail kurzu <FiArrowRight className="ml-2" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
