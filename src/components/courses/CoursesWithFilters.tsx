'use client';

import { useState, useMemo, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import CourseCard from '@/app/kurzy/CourseCard';
import { useAuth } from '@/contexts/AuthContext';

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

interface CoursesWithFiltersProps {
  courses: Course[];
  userCourseAccess: Record<string, boolean>;
}

type FilterType = 'all' | 'free' | 'paid' | 'mindfulness' | 'personal-development';

export default function CoursesWithFilters({ courses, userCourseAccess }: CoursesWithFiltersProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Žádné API volání! Data jsou předána z Server komponenty
  console.log('📦 Přístup ke kurzům předán ze serveru:', Object.keys(userCourseAccess).length, 'kurzů');

  // Filtrování kurzů podle aktivního filtru
  const filteredCourses = useMemo(() => {
    switch (activeFilter) {
      case 'free':
        return courses.filter(course => course.price === 0);
      case 'paid':
        return courses.filter(course => course.price > 0);
      case 'mindfulness':
        return courses.filter(course => 
          course.tags?.some(tag => 
            tag.toLowerCase().includes('mindfulness') || 
            tag.toLowerCase().includes('meditace') ||
            tag.toLowerCase().includes('klid')
          )
        );
      case 'personal-development':
        return courses.filter(course => 
          course.tags?.some(tag => 
            tag.toLowerCase().includes('osobní') || 
            tag.toLowerCase().includes('rozvoj') ||
            tag.toLowerCase().includes('růst') ||
            tag.toLowerCase().includes('psychologie')
          )
        );
      default:
        return courses;
    }
  }, [courses, activeFilter]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const getFilterButtonClass = (filter: FilterType) => {
    const baseClass = "px-3 py-1 rounded-full text-sm transition-colors";
    return activeFilter === filter
      ? `${baseClass} bg-primary-600 text-white`
      : `${baseClass} bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50`;
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <FiFilter className="mr-2 text-neutral-600" />
          <span className="font-medium">Filtrovat:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            className={getFilterButtonClass('all')}
            onClick={() => handleFilterClick('all')}
          >
            Všechny ({courses.length})
          </button>
          <button 
            className={getFilterButtonClass('free')}
            onClick={() => handleFilterClick('free')}
          >
            Zdarma ({courses.filter(c => c.price === 0).length})
          </button>
          <button 
            className={getFilterButtonClass('paid')}
            onClick={() => handleFilterClick('paid')}
          >
            Placené ({courses.filter(c => c.price > 0).length})
          </button>
          <button 
            className={getFilterButtonClass('mindfulness')}
            onClick={() => handleFilterClick('mindfulness')}
          >
            Mindfulness ({courses.filter(c => 
              c.tags?.some(tag => 
                tag.toLowerCase().includes('mindfulness') || 
                tag.toLowerCase().includes('meditace') ||
                tag.toLowerCase().includes('klid')
              )
            ).length})
          </button>
          <button 
            className={getFilterButtonClass('personal-development')}
            onClick={() => handleFilterClick('personal-development')}
          >
            Osobní rozvoj ({courses.filter(c => 
              c.tags?.some(tag => 
                tag.toLowerCase().includes('osobní') || 
                tag.toLowerCase().includes('rozvoj') ||
                tag.toLowerCase().includes('růst') ||
                tag.toLowerCase().includes('psychologie')
              )
            ).length})
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-6 text-sm text-neutral-600">
        Zobrazeno {filteredCourses.length} z {courses.length} kurzů
        {activeFilter !== 'all' && (
          <span className="ml-2">
            (filtrováno: {activeFilter === 'free' ? 'Zdarma' : 
                          activeFilter === 'paid' ? 'Placené' : 
                          activeFilter === 'mindfulness' ? 'Mindfulness' : 
                          'Osobní rozvoj'})
          </span>
        )}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course: Course, index: number) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              priority={index < 6}
              hasAccess={userCourseAccess[course.id] || false}
              loadingAccess={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-neutral-600 mb-4">
            Pro vybraný filtr nebyly nalezeny žádné kurzy.
          </p>
          <button 
            onClick={() => setActiveFilter('all')}
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            Zobrazit všechny kurzy
          </button>
        </div>
      )}
    </div>
  );
}
