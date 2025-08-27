'use client';

import { useState } from 'react';
import CourseList from '@/components/admin/courses/CourseList';
import { Course } from '@/types/course';

interface AdminCoursesClientProps {
  initialCourses: Course[];
}

/**
 * Client komponenta pro interaktivní správu kurzů
 */
export default function AdminCoursesClient({ initialCourses }: AdminCoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Znovu načtení kurzů (při změnách)
  const refreshCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Po změnách refreshneme stránku aby se data znovu načetla ze serveru
      window.location.reload();
    } catch (err) {
      console.error('Chyba při obnovování kurzů:', err);
      setError('Nepodařilo se obnovit seznam kurzů');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Zpracování vytvoření nového kurzu
  const handleCourseCreated = (course: Course) => {
    setCourses([course, ...courses]);
  };
  
  // Zpracování aktualizace kurzu
  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourses(courses.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    ));
  };
  
  // Zpracování smazání kurzu
  const handleCourseDeleted = (courseId: string) => {
    setCourses(courses.filter(course => course.id !== courseId));
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Správa kurzů</h1>
          <p className="text-neutral-600">Celkem {courses.length} kurzů</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshCourses}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50"
          >
            {isLoading ? 'Obnovuji...' : 'Obnovit'}
          </button>
          <a
            href="/admin/kurzy/novy"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
          >
            Přidat kurz
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <CourseList 
        courses={courses}
        onCourseCreated={handleCourseCreated}
        onCourseUpdated={handleCourseUpdated}
        onCourseDeleted={handleCourseDeleted}
        onRefresh={refreshCourses}
      />
    </div>
  );
}
