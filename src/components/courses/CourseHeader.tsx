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
        
        {/* Omezený popis kurzu */}
        <div className="mb-6">
          <p className="text-neutral-700 mb-4">
            {course.description.length > 150 
              ? `${course.description.substring(0, 150)}...` 
              : course.description
            }
          </p>
          
          {/* Tlačítko pro zobrazení detailu kurzu */}
          <Link 
            href={`/kurzy/${course.slug}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            Zobrazit detail kurzu
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
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
