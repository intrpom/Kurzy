'use client';

import CourseImage from '@/components/CourseImage';
import CourseAccessButton from '@/components/courses/CourseAccessButton';

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
  return (
    <div className="card">
      <div className="relative h-48 bg-neutral-100">
        {course.imageUrl ? (
          <div className="relative" style={{ width: '100%', height: '192px', overflow: 'hidden' }}>
            <CourseImage 
              src={course.imageUrl} 
              alt={course.title}
              width={400}
              height={225}
              className="rounded-t-lg"
              priority={priority}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-400">Bez obrázku</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-secondary-500 text-white text-sm font-medium px-2 py-1 rounded">
          {course.price === 0 ? 'Zdarma' : `${course.price} Kč`}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
        <p className="text-neutral-700 mb-4">
          {course.subtitle || course.description.substring(0, 120) + '...'}
        </p>
        <CourseAccessButton 
          courseId={course.id}
          slug={course.slug}
          price={Number(course.price)}
        />
      </div>
    </div>
  );
}
