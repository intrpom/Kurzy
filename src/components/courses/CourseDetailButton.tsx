'use client';

import CourseAccessButton from './CourseAccessButton';

interface CourseDetailButtonProps {
  courseId: string;
  slug: string;
  price: number;
}

export default function CourseDetailButton({ courseId, slug, price }: CourseDetailButtonProps) {
  return (
    <CourseAccessButton 
      courseId={courseId}
      slug={slug}
      price={price}
      isDetailPage={true}
    />
  );
}
