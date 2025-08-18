'use client';

import CourseManager from '@/components/admin/courses/CourseManager';

/**
 * Stránka pro editaci kurzu v administraci
 */
export default function EditCoursePage({ params }: { params: { id: string } }) {
  return (
    <CourseManager courseId={params.id} />
  );
}
