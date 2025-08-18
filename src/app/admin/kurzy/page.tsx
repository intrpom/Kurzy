'use client';

import { useState, useEffect } from 'react';
import CourseList from '@/components/admin/courses/CourseList';
import { Course } from '@/types/course';
import { loadCourseList } from '@/api/adminCourseList';

/**
 * Stránka pro správu kurzů v administraci
 */
export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Načtení seznamu kurzů
  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courseData = await loadCourseList();
      setCourses(courseData);
    } catch (err) {
      console.error('Chyba při načítání kurzů:', err);
      setError('Nepodařilo se načíst seznam kurzů');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Načtení kurzů při prvním renderování
  useEffect(() => {
    fetchCourses();
  }, []);
  
  // Zpracování vytvoření nového kurzu
  const handleCourseCreated = (course: Course) => {
    setCourses([...courses, course]);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">Správa kurzů</h1>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
          <p>Načítání kurzů...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
          <button 
            onClick={fetchCourses}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Zkusit znovu
          </button>
        </div>
      ) : (
        <CourseList 
          courses={courses} 
          onCourseDeleted={fetchCourses}
          onCourseCreated={handleCourseCreated}
        />
      )}
    </div>
  );
}
