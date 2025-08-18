'use client';

/**
 * API funkce pro práci s postupem uživatele v kurzech
 */

import { Course } from '@/types/course';

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
          console.log('Získáno ID kurzu ze slugu:', { slug, courseId });
        }
      }
    } catch (error) {
      console.error('Chyba při získávání ID kurzu podle slugu:', error);
      throw new Error('Nepodařilo se získat ID kurzu');
    }
  }
  
  if (!courseId) {
    console.error('Nepodařilo se získat ID kurzu');
    throw new Error('Kurz nebyl nalezen');
  }
  
  console.log('Kontroluji přístup ke kurzu:', { slug, courseId });
  
  // Použijeme XMLHttpRequest pro lepší podporu cookies
  const checkAccessPromise = new Promise<{hasAccess: boolean}>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    // Přidáme timestamp pro zabránění cachování
    const timestamp = Date.now();
    xhr.open('GET', `/api/user/courses?courseId=${courseId}&_=${timestamp}`, true);
    
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '0');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log('Kontrola přístupu ke kurzu - odpověď:', { status: xhr.status, response: xhr.responseText });
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            resolve(responseData);
          } catch (error) {
            console.error('Chyba při parsování odpovědi:', error);
            reject(new Error('Chyba při parsování odpovědi'));
          }
        } else {
          console.error('HTTP chyba při kontrole přístupu:', xhr.status);
          reject(new Error(`HTTP chyba: ${xhr.status}`));
        }
      }
    };
    
    xhr.send();
  });
  
  let accessData;
  try {
    accessData = await checkAccessPromise;
    
    if (!accessData.hasAccess) {
      console.error('Uživatel nemá přístup ke kurzu');
      throw new Error('Nemáte přístup k tomuto kurzu');
    }
  } catch (error) {
    console.error('Chyba při kontrole přístupu ke kurzu:', error);
    throw error;
  }
  
  // Načtení detailu kurzu
  console.log('Načítám detail kurzu:', { courseId });
  
  // Použijeme XMLHttpRequest pro lepší podporu cookies
  const loadCoursePromise = new Promise<Course>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    // Přidáme timestamp pro zabránění cachování
    const timestamp = Date.now();
    xhr.open('GET', `/api/courses/${courseId}?_=${timestamp}`, true);
    
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '0');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log('Načtení kurzu - odpověď:', { status: xhr.status });
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const courseData = JSON.parse(xhr.responseText);
            resolve(courseData);
          } catch (error) {
            console.error('Chyba při parsování odpovědi:', error);
            reject(new Error('Chyba při parsování odpovědi'));
          }
        } else {
          console.error('HTTP chyba při načítání kurzu:', xhr.status);
          reject(new Error(`HTTP chyba: ${xhr.status}`));
        }
      }
    };
    
    xhr.send();
  });
  
  try {
    const courseData = await loadCoursePromise;
    console.log('Kurz úspěšně načten:', { courseId, title: courseData.title });
    
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
export async function saveLessonProgress(lessonId: string): Promise<{success: boolean}> {
  try {
    // Zde by byl API call pro uložení postupu
    console.log(`Ukládám postup pro lekci ${lessonId}`);
    // Implementace API volání pro uložení postupu bude přidána později
    return { success: true };
  } catch (error) {
    console.error('Chyba při ukládání postupu:', error);
    throw error;
  }
}
