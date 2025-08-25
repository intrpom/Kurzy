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
          <CourseAccessButton 
            courseId={course.id}
            slug={course.slug}
            price={Number(course.price)}
          />
        </div>
      </div>
    </div>
  );
}
