'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Course } from '@/types/course';

interface CourseHeaderProps {
  course: Course;
}

/**
 * Komponenta pro zobrazení záhlaví kurzu s navigací a základními informacemi
 */
export default function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <>
      {/* Course Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/moje-kurzy" className="text-neutral-600 hover:text-primary-600 flex items-center">
                <FiArrowLeft size={20} className="mr-2" />
                <span>Zpět na moje kurzy</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <h1 className="text-3xl font-serif font-bold mb-2">{course.title}</h1>
        <p className="text-neutral-700 mb-6">{course.description}</p>
        
        {course.progress !== undefined && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Váš postup</span>
              <span className="text-sm font-medium">{course.progress}%</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full" 
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
