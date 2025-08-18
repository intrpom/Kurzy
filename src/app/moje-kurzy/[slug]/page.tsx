'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { Course } from '@/types/course';
import ModuleAccordion from '@/components/courses/ModuleAccordion';
import LessonPlayer from '@/components/courses/LessonPlayer';
import CourseHeader from '@/components/courses/CourseHeader';
import CourseContentManager from '@/components/courses/CourseContentManager';
import { loadUserCourse } from '@/api/userCourseProgress';

/**
 * Stránka kurzu pro přihlášené uživatele
 * Zobrazuje obsah kurzu, přehrávač lekcí a umožňuje navigaci mezi lekcemi
 */
export default function CoursePage({ params }: { params: { slug: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Načtení dat kurzu
  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      try {
        // Načteme kurz a ověříme přístup uživatele
        const courseData = await loadUserCourse(params.slug);
        setCourse(courseData);
      } catch (error: any) {
        console.error('Chyba při načítání kurzu:', error);
        setError(error.message || 'Nepodařilo se načíst kurz');
        
        // Pokud nemá uživatel přístup, přesměrujeme ho na seznam kurzů
        if (error.message === 'Nemáte přístup k tomuto kurzu') {
          router.push('/kurzy');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourse();
  }, [params.slug, router]);
  
  // Stavy načítání a chyb
  if (loading) {
    return (
      <MainLayout>
        <div className="container-custom py-16 text-center">
          <p>Načítání kurzu...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !course) {
    return (
      <MainLayout>
        <div className="container-custom py-16 text-center">
          <p className="text-red-500">{error || 'Kurz nebyl nalezen'}</p>
          <Link href="/moje-kurzy" className="text-primary-600 hover:underline mt-4 inline-block">
            Zpět na moje kurzy
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  // Vykreslení kurzu
  return (
    <MainLayout>
      <CourseHeader course={course} />
      
      <div className="container-custom">
        <CourseContentManager initialCourse={course}>
          {({ course, currentModuleId, currentLessonId, handleLessonClick, handleLessonComplete }) => (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar - Course Structure */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 max-h-[calc(100vh-120px)]">
                  <h2 className="text-xl font-medium mb-6">Obsah kurzu</h2>
                  
                  <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                    {course.modules.map((module, moduleIndex) => (
                      <ModuleAccordion
                        key={module.id}
                        module={module}
                        index={moduleIndex}
                        isActive={module.id === currentModuleId}
                        onLessonClick={handleLessonClick}
                        currentLessonId={currentLessonId}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Main Content - Lesson Player */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <LessonPlayer
                  course={course}
                  currentModuleId={currentModuleId}
                  currentLessonId={currentLessonId}
                  onLessonComplete={handleLessonComplete}
                  onNavigateLesson={handleLessonClick}
                />
              </div>
            </div>
          )}
        </CourseContentManager>
      </div>
    </MainLayout>
  );
}
