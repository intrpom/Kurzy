'use client';

import CourseManager from '@/components/admin/courses/CourseManager';

/**
 * Stránka pro vytvoření nového kurzu v administraci
 */
export default function NewCoursePage() {
  return (
    <CourseManager courseId="new" />
  );
}
