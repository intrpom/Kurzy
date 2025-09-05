'use client';

/**
 * API funkce pro práci s postupem uživatele v kurzech
 */

import { Course } from '@/types/course';
import { courseAccessCache } from '@/lib/course-access-cache';

/**
 * Načte kurz podle slugu a ověří přístup uživatele
 * @param slug Slug kurzu
 * @returns Kurz s informacemi o postupu
 */
export async function loadUserCourse(slug: string): Promise<Course> {
  // Nejprve získáme ID kurzu podle slugu nebo z URL
  const urlParams = new URLSearchParams(window.location.search);
  let courseId = urlParams.get('id');
  
  if (!courseId) {
    // Pokud nemáme courseId z URL, získáme ho podle slugu
    try {
      const response = await fetch(`/api/courses/slug/${slug}?_=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const courseData = await response.json();
        if (courseData && courseData.id) {
          courseId = courseData.id;
        }
      }
    } catch (error) {
      console.error('Chyba při získávání ID kurzu podle slugu:', error);
      throw new Error('Nepodařilo se získat ID kurzu');
    }
  }
  
  if (!courseId) {
    throw new Error('Kurz nebyl nalezen');
  }

  // Použij centralizovanou cache pro kontrolu přístupu
  const accessResult = await courseAccessCache.checkAccess(courseId);
  
  // Kontrola přístupu
  if (!accessResult.hasAccess) {
    throw new Error('Nemáte přístup k tomuto kurzu');
  }
  
  // Načtení detailu kurzu
  const loadCoursePromise = fetch(`/api/courses/${courseId}?_=${Date.now()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(async (response) => {
    if (response.ok) {
      return await response.json();
    } else {
      const errorText = await response.text();
      console.error('HTTP chyba při načítání kurzu:', response.status, errorText);
      throw new Error(`HTTP chyba: ${response.status}`);
    }
  });
  
  try {
    const courseData = await loadCoursePromise;
    
    // Přidáme informace o postupu
    return calculateCourseProgress(courseData);
  } catch (error) {
    console.error('Chyba při načítání kurzu:', error);
    throw error;
  }
}

/**
 * Vypočítá postup v kurzu
 * @param course Kurz
 * @returns Kurz s vypočítaným postupem
 */
export function calculateCourseProgress(course: Course): Course {
  const updatedCourse = { ...course };
  
  // Výpočet postupu pro každý modul
  updatedCourse.modules = updatedCourse.modules.map(module => {
    const totalLessons = module.lessons.length;
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    
    return {
      ...module,
      completed: totalLessons > 0 && completedLessons === totalLessons
    };
  });
  
  // Výpočet celkového postupu v kurzu
  const totalLessons = updatedCourse.modules.reduce((total, module) => 
    total + module.lessons.length, 0);
  
  const completedLessons = updatedCourse.modules.reduce((total, module) => 
    total + module.lessons.filter(lesson => lesson.completed).length, 0);
  
  updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  updatedCourse.completed = updatedCourse.progress === 100;
  
  return updatedCourse;
}

/**
 * Uloží postup v lekci
 * @param lessonId ID lekce
 * @returns Výsledek operace
 */
export async function saveLessonProgress(lessonId: string): Promise<{success: boolean; courseProgress?: any}> {
  try {
    console.log(`Ukládám postup pro lekci ${lessonId}`);
    
    const response = await fetch('/api/user/lesson-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lessonId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Nepodařilo se uložit postup lekce');
    }
    
    const data = await response.json();
    console.log(`✅ Postup lekce ${lessonId} úspěšně uložen`);
    
    return { 
      success: true, 
      courseProgress: data.courseProgress 
    };
  } catch (error) {
    console.error('Chyba při ukládání postupu:', error);
    throw error;
  }
}

/**
 * Načte postup lekcí pro uživatele
 * @param courseId ID kurzu (volitelné)
 * @returns Mapa lessonId -> postup
 */
export async function loadLessonProgress(courseId?: string): Promise<Record<string, { completed: boolean; completedAt: string }>> {
  try {
    const url = courseId 
      ? `/api/user/lesson-progress?courseId=${courseId}`
      : '/api/user/lesson-progress';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Uživatel není přihlášen - vrátíme prázdný objekt
        return {};
      }
      throw new Error('Nepodařilo se načíst postup lekcí');
    }
    
    const data = await response.json();
    return data.lessonProgress || {};
  } catch (error) {
    console.error('Chyba při načítání postupu lekcí:', error);
    return {};
  }
}