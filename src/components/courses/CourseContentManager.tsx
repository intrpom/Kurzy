'use client';

import { useState } from 'react';
import { Course } from '@/types/course';
import { calculateCourseProgress, saveLessonProgress } from '@/api/userCourseProgress';

interface CourseContentManagerProps {
  initialCourse: Course;
  children: (props: {
    course: Course;
    currentModuleId: string;
    currentLessonId: string;
    handleLessonClick: (lessonId: string) => void;
    handleLessonComplete: (lessonId: string) => void;
  }) => React.ReactNode;
}

/**
 * Komponenta pro správu stavu kurzu a lekcí
 * Poskytuje funkce pro navigaci mezi lekcemi a označování lekcí jako dokončené
 */
export default function CourseContentManager({ initialCourse, children }: CourseContentManagerProps) {
  // Zajistíme, že initialCourse má vždy inicializované pole modulů a lekcí
  const safeInitialCourse = { ...initialCourse };
  
  // Kontrola a inicializace modulů
  if (!safeInitialCourse.modules) {
    console.warn('CourseContentManager: Kurz nemá inicializované pole modulů!');
    safeInitialCourse.modules = [];
  }
  
  // Kontrola a inicializace lekcí pro každý modul
  safeInitialCourse.modules = safeInitialCourse.modules.map(module => {
    if (!module.lessons) {
      console.warn(`CourseContentManager: Modul ${module.title} nemá inicializované pole lekcí!`);
      module.lessons = [];
    }
    
    // Kontrola a inicializace materiálů pro každou lekci
    module.lessons = module.lessons.map(lesson => {
      if (!lesson.materials) {
        console.warn(`CourseContentManager: Lekce ${lesson.title} nemá inicializované pole materiálů!`);
        lesson.materials = [];
      }
      return lesson;
    });
    
    return module;
  });
  
  // Logování pro diagnostiku
  console.log('CourseContentManager: Inicializovaný kurz:', {
    title: safeInitialCourse.title,
    modulesCount: safeInitialCourse.modules.length,
    modules: safeInitialCourse.modules.map(m => ({
      title: m.title,
      lessonsCount: m.lessons.length
    }))
  });
  
  const [course, setCourse] = useState<Course>(safeInitialCourse);
  const [currentModuleId, setCurrentModuleId] = useState<string>(
    safeInitialCourse.modules.length > 0 ? safeInitialCourse.modules[0].id : ''
  );
  const [currentLessonId, setCurrentLessonId] = useState<string>(
    safeInitialCourse.modules.length > 0 && safeInitialCourse.modules[0].lessons.length > 0 
      ? safeInitialCourse.modules[0].lessons[0].id 
      : ''
  );

  // Obsluha kliknutí na lekci
  const handleLessonClick = (lessonId: string) => {
    // Najdeme modul, který obsahuje vybranou lekci
    const moduleWithLesson = course.modules.find(module => 
      module.lessons.some(lesson => lesson.id === lessonId)
    );
    
    if (moduleWithLesson) {
      setCurrentModuleId(moduleWithLesson.id);
      setCurrentLessonId(lessonId);
    }
  };

  // Obsluha dokončení lekce
  const handleLessonComplete = (lessonId: string) => {
    // Vytvoříme kopii kurzu a označíme lekci jako dokončenou
    const updatedCourse = { ...course };
    
    // Najdeme modul a lekci
    for (const module of updatedCourse.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === lessonId) {
          // Označíme lekci jako dokončenou
          lesson.completed = true;
          break;
        }
      }
    }
    
    // Přepočítáme postup v kurzu
    const courseWithProgress = calculateCourseProgress(updatedCourse);
    setCourse(courseWithProgress);
    
    // Uložení postupu na server
    saveLessonProgress(lessonId).catch(error => {
      console.error('Chyba při ukládání postupu:', error);
    });
  };

  return (
    <>
      {children({
        course,
        currentModuleId,
        currentLessonId,
        handleLessonClick,
        handleLessonComplete,
      })}
    </>
  );
}
