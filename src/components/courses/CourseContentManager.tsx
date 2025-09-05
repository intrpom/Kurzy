'use client';

import { useState, useEffect } from 'react';
import { Course } from '@/types/course';
import { calculateCourseProgress, saveLessonProgress, loadLessonProgress } from '@/api/userCourseProgress';

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

  // Načíst skutečný postup lekcí při inicializaci
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const lessonProgress = await loadLessonProgress(initialCourse.id);
        
        // Aktualizovat kurz s načteným postupem
        const updatedCourse = { ...safeInitialCourse };
        
        // Označit dokončené lekce
        for (const module of updatedCourse.modules) {
          for (const lesson of module.lessons) {
            if (lessonProgress[lesson.id]?.completed) {
              lesson.completed = true;
            }
          }
        }
        
        // Přepočítat celkový postup kurzu
        const courseWithProgress = calculateCourseProgress(updatedCourse);
        setCourse(courseWithProgress);
        
        console.log(`📚 Načten postup kurzu ${initialCourse.title}: ${courseWithProgress.progress}%`);
      } catch (error) {
        console.error('Chyba při načítání postupu kurzu:', error);
        // Pokud se nepodaří načíst postup, použijeme bezpečný kurz
        setCourse(safeInitialCourse);
      }
    };
    
    loadProgress();
  }, [initialCourse.id, initialCourse.title]);

  // Obsluha kliknutí na lekci
  const handleLessonClick = (lessonId: string) => {
    // Najdeme modul, který obsahuje vybranou lekci
    const moduleWithLesson = course.modules.find(module => 
      module.lessons.some(lesson => lesson.id === lessonId)
    );
    
    if (moduleWithLesson) {
      setCurrentModuleId(moduleWithLesson.id);
      setCurrentLessonId(lessonId);
      
      // Na mobilních zařízeních scrolluj na video přehrávač
      // Použijeme requestAnimationFrame pro lepší timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const isMobile = window.innerWidth < 1024 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            console.log('Mobile detected, scrolling to top after DOM update...');
            
            // Zkusíme scrollIntoView na video container
            const videoPlayer = document.querySelector('.lesson-player-container');
            if (videoPlayer) {
              videoPlayer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            } else {
              // Fallback na window.scrollTo
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }
          }
        });
      });
    }
  };

  // Obsluha dokončení lekce
  const handleLessonComplete = async (lessonId: string) => {
    try {
      // Nejdříve uložíme postup na server
      const result = await saveLessonProgress(lessonId);
      
      if (result.success) {
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
        
        // Pokud máme postup kurzu ze serveru, použijeme ho
        if (result.courseProgress) {
          updatedCourse.progress = result.courseProgress.progress;
          updatedCourse.completed = result.courseProgress.completed;
        } else {
          // Jinak přepočítáme postup lokálně
          const courseWithProgress = calculateCourseProgress(updatedCourse);
          updatedCourse.progress = courseWithProgress.progress;
          updatedCourse.completed = courseWithProgress.completed;
        }
        
        setCourse(updatedCourse);
        console.log('✅ Lekce označena jako dokončená a postup aktualizován');
      }
    } catch (error) {
      console.error('Chyba při ukládání postupu:', error);
      // Zobrazit chybu uživateli (můžeme přidat toast notifikaci později)
      alert('Nepodařilo se uložit postup lekce. Zkuste to prosím znovu.');
    }
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
