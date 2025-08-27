'use client';

import MainLayout from '@/app/MainLayout';
import { Course } from '@/types/course';
import ModuleAccordion from '@/components/courses/ModuleAccordion';
import LessonPlayer from '@/components/courses/LessonPlayer';
import CourseHeader from '@/components/courses/CourseHeader';
import CourseContentManager from '@/components/courses/CourseContentManager';

interface CoursePageClientProps {
  course: Course;
}

/**
 * Client-side komponenta pro zobrazení kurzu
 * Přijímá data ze server-side komponenty
 */
export default function CoursePageClient({ course }: CoursePageClientProps) {
  console.log('🎯 Client: Kurz předán ze serveru:', { title: course.title, modulesCount: course.modules.length });
  
  return (
    <MainLayout>
      <CourseHeader course={course} />
      
      <div className="container-custom">
        <CourseContentManager initialCourse={course}>
          {({ course, currentModuleId, currentLessonId, handleLessonClick, handleLessonComplete }) => (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar - Course Structure */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8 max-h-[calc(100vh-120px)]">
                  <h2 className="text-xl font-medium mb-6">Obsah kurzu</h2>
                  
                  <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                    {course.modules.map((module, moduleIndex) => (
                      <ModuleAccordion
                        key={module.id}
                        module={module}
                        index={moduleIndex}
                        isActive={module.id === currentModuleId}
                        onLessonClick={handleLessonClick}
                        currentLessonId={currentLessonId}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Main Content - Lesson Player */}
              <div className="lg:col-span-2 order-1 lg:order-2 lesson-player-container">
                <LessonPlayer
                  course={course}
                  currentModuleId={currentModuleId}
                  currentLessonId={currentLessonId}
                  onLessonComplete={handleLessonComplete}
                  onNavigateLesson={handleLessonClick}
                />
              </div>
            </div>
          )}
        </CourseContentManager>
      </div>
    </MainLayout>
  );
}
