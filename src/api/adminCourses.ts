'use client';

/**
 * API funkce pro správu kurzů v administraci
 */

import { Course, Module, Lesson } from '@/types/course';
import logger from '@/utils/logger';

/**
 * Načte kurz podle ID
 * @param id ID kurzu
 * @returns Kurz
 */
export async function loadCourse(id: string): Promise<Course> {
  return new Promise((resolve, reject) => {
    try {
      logger.info('Načítám kurz:', id);
      
      // Použití XMLHttpRequest pro lepší podporu cookies
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/api/courses/${id}`, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const course = JSON.parse(xhr.responseText);
            logger.info('Kurz úspěšně načten:', course.id);
            logger.info('Počet modulů v kurzu:', course.modules?.length || 0);
            if (course.modules && course.modules.length > 0) {
              logger.info('První modul:', course.modules[0].title, 'ID:', course.modules[0].id);
              logger.info('Počet lekcí v prvním modulu:', course.modules[0].lessons?.length || 0);
            } else {
              logger.info('Kurz nemá žádné moduly!');
            }
            resolve(course);
          } catch (parseError) {
            console.error('Chyba při parsování odpovědi:', parseError);
            reject(new Error('Nepodařilo se zpracovat odpověď serveru'));
          }
        } else {
          logger.error('HTTP chyba při načítání kurzu:', xhr.status, xhr.responseText);
          reject(new Error(`HTTP chyba: ${xhr.status} - ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = function() {
        logger.error('Síťová chyba při načítání kurzu');
        reject(new Error('Síťová chyba při načítání kurzu'));
      };
      
      xhr.send();
    } catch (error) {
      logger.error('Chyba při načítání kurzu:', error);
      reject(error);
    }
  });
}

/**
 * Vytvoří nový kurz
 * @param course Kurz k vytvoření
 * @returns Vytvořený kurz
 */
export async function createCourse(course: Course): Promise<Course> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Vytvářím nový kurz');
      
      // Použití XMLHttpRequest pro lepší podporu cookies
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/courses`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      xhr.withCredentials = true;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const createdCourse = JSON.parse(xhr.responseText);
            console.log('Kurz úspěšně vytvořen:', createdCourse);
            resolve(createdCourse);
          } catch (parseError) {
            console.error('Chyba při parsování odpovědi:', parseError);
            reject(new Error('Nepodařilo se zpracovat odpověď serveru'));
          }
        } else {
          console.error('HTTP chyba při vytváření kurzu:', xhr.status, xhr.responseText);
          reject(new Error(`HTTP chyba: ${xhr.status} - ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = function() {
        console.error('Síťová chyba při vytváření kurzu');
        reject(new Error('Síťová chyba při vytváření kurzu'));
      };
      
      xhr.send(JSON.stringify(course));
    } catch (error) {
      console.error('Chyba při vytváření kurzu:', error);
      reject(error);
    }
  });
}

/**
 * Uloží kurz
 * @param course Kurz k uložení
 * @returns Uložený kurz
 */
export async function saveCourse(course: Course): Promise<Course> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Ukládám kurz:', course.id);
      
      // Použití XMLHttpRequest pro lepší podporu cookies
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `/api/courses/${course.id}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      xhr.withCredentials = true;
      
      xhr.onload = async function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const savedCourse = JSON.parse(xhr.responseText);
            console.log('Kurz úspěšně uložen:', savedCourse.id);
            
            // Aktualizace modulů kurzu
            if (course.modules && course.modules.length > 0) {
              try {
                console.log('Aktualizuji moduly kurzu...');
                for (const module of course.modules) {
                  console.log(`Aktualizuji modul ${module.id}, videoLibraryId: ${module.videoLibraryId || 'není nastaveno'}`);
                  await updateModule(course.id, module);
                }
                console.log('Všechny moduly byly úspěšně aktualizovány');
              } catch (moduleError) {
                console.error('Chyba při aktualizaci modulů:', moduleError);
                // Pokračujeme i když se nepodaří aktualizovat moduly
              }
            } else {
              console.log('Kurz nemá žádné moduly k aktualizaci');
            }
            
            resolve(savedCourse);
          } catch (parseError) {
            console.error('Chyba při parsování odpovědi:', parseError);
            reject(new Error('Nepodařilo se zpracovat odpověď serveru'));
          }
        } else {
          console.error('HTTP chyba při ukládání kurzu:', xhr.status, xhr.responseText);
          reject(new Error(`HTTP chyba: ${xhr.status} - ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = function() {
        console.error('Síťová chyba při ukládání kurzu');
        reject(new Error('Síťová chyba při ukládání kurzu'));
      };
      
      xhr.send(JSON.stringify(course));
    } catch (error) {
      console.error('Chyba při ukládání kurzu:', error);
      reject(error);
    }
  });
}

// Cache pro API volání
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

/**
 * Optimalizované ukládání kurzu s paralelním ukládáním lekcí
 * @param course Kurz k uložení
 * @param originalCourse Původní stav kurzu pro porovnání změn
 * @param changedLessonIds ID lekcí, které byly změněny (volitelné)
 * @returns Uložený kurz
 */
export async function saveCourseOptimized(
  course: Course, 
  originalCourse: Course | null = null,
  changedLessonIds: string[] = []
): Promise<Course> {
  try {
    console.log('Optimalizované ukládání kurzu:', course.id);
    
    // 1. Nejdříve uložíme základní kurz (bez modulů a lekcí)
    const courseToSave = {
      ...course,
      modules: [] // Neukládáme moduly a lekce přes kurz API
    };
    
    const courseResponse = await fetch(`/api/courses/${course.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      credentials: 'include',
      body: JSON.stringify(courseToSave)
    });
    
    if (!courseResponse.ok) {
      throw new Error(`HTTP chyba: ${courseResponse.status} - ${courseResponse.statusText}`);
    }
    
    const savedCourse = await courseResponse.json();
    console.log('Kurz úspěšně uložen:', savedCourse.id);
    
    // Invalidate cache pro tento kurz
    apiCache.delete(`course-${course.id}`);
    
    // 2. Paralelně uložíme všechny změněné lekce najednou
    if (changedLessonIds.length > 0 && course.modules && course.modules.length > 0) {
      try {
        console.log(`Paralelně ukládám ${changedLessonIds.length} změněných lekcí...`);
        
        // Najdeme všechny změněné lekce
        const lessonsToUpdate: Lesson[] = [];
        
        for (const lessonId of changedLessonIds) {
          // Procházíme všechny moduly a hledáme lekci
          for (const module of course.modules) {
            const lesson = module.lessons.find(l => l.id === lessonId);
            if (lesson) {
              lessonsToUpdate.push(lesson);
              break;
            }
          }
        }
        
        if (lessonsToUpdate.length > 0) {
          // Pro velké množství lekcí použijeme batch processing
          if (lessonsToUpdate.length > 20) {
            console.log(`Používám batch processing pro ${lessonsToUpdate.length} lekcí`);
            await saveLessonsBatch(lessonsToUpdate);
          } else {
            // Pro menší množství použijeme paralelní ukládání
            console.log(`Používám paralelní ukládání pro ${lessonsToUpdate.length} lekcí`);
            
            // Vytvoříme pole Promise pro paralelní ukládání
            const lessonPromises = lessonsToUpdate.map(async (lesson) => {
              console.log(`Ukládám lekci ${lesson.id}`);
              return saveLesson(lesson);
            });
            
            // Paralelně spustíme všechny Promise a počkáme na dokončení
            const results = await Promise.all(lessonPromises);
            const successfulSaves = results.filter(result => result !== null).length;
            
            console.log(`Úspěšně uloženo ${successfulSaves} z ${lessonsToUpdate.length} lekcí`);
          }
          
          // Invalidate cache pro všechny změněné lekce
          changedLessonIds.forEach(lessonId => {
            apiCache.delete(`lesson-${lessonId}`);
          });
        }
        
      } catch (lessonError: any) {
        console.error('Chyba při paralelním ukládání lekcí:', lessonError);
        // Pokračujeme i když se nepodaří aktualizovat lekce
        // Uživatel uvidí chybu v toast notifikaci
        throw new Error(`Kurz byl uložen, ale nepodařilo se uložit některé lekce: ${lessonError.message || 'Neznámá chyba'}`);
      }
    } else {
      console.log('Nebyly detekovány žádné změněné lekce, přeskakuji aktualizaci');
    }
    
    return savedCourse;
    
  } catch (error) {
    console.error('Chyba při optimalizovaném ukládání kurzu:', error);
    throw error;
  }
}

/**
 * Vytvoří nový modul v kurzu
 * @param courseId ID kurzu
 * @param module Modul k vytvoření
 * @returns Vytvořený modul
 */
export async function createModule(courseId: string, module: Module): Promise<Module> {
  try {
    const response = await fetch(`/api/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        ...module,
        courseId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    const createdModule = await response.json();
    return createdModule;
  } catch (error) {
    console.error('Chyba při vytváření modulu:', error);
    throw error;
  }
}

/**
 * Aktualizuje modul včetně všech jeho lekcí a materiálů
 * @param courseId ID kurzu
 * @param module Modul k aktualizaci
 * @returns Aktualizovaný modul
 */
export async function updateModule(courseId: string, module: Module): Promise<Module> {
  try {
    // Přidáme courseId do modulu
    const moduleData = {
      ...module,
      courseId
    };
    
    // Log počtu lekcí a materiálů
    if (module.lessons && module.lessons.length > 0) {
      console.log(`Modul ${module.id} obsahuje ${module.lessons.length} lekcí`);
      
      // Spočítáme celkový počet materiálů ve všech lekcích
      const materialCount = module.lessons.reduce((count, lesson) => {
        return count + (lesson.materials?.length || 0);
      }, 0);
      
      console.log(`Celkový počet materiálů v modulu: ${materialCount}`);
    }
    
    // Aktualizace modulu včetně všech lekcí a materiálů v jednom volání API
    const response = await fetch(`/api/modules/${module.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP chyba při aktualizaci modulu: ${response.status}`, errorText);
      throw new Error(`HTTP chyba: ${response.status} - ${errorText}`);
    }
    
    const updatedModule = await response.json();
    console.log(`Modul ${module.id} úspěšně aktualizován včetně všech lekcí a materiálů`);
    
    return updatedModule;
  } catch (error) {
    console.error('Chyba při aktualizaci modulu:', error);
    throw error;
  }
}

/**
 * Smaže modul
 * @param courseId ID kurzu
 * @param moduleId ID modulu
 * @returns True, pokud byl modul úspěšně smazán
 */
export async function deleteModule(courseId: string, moduleId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/modules/${moduleId}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Chyba při mazání modulu:', error);
    throw error;
  }
}

/**
 * Vytvoří novou lekci v modulu
 * @param courseId ID kurzu
 * @param moduleId ID modulu
 * @param lesson Lekce k vytvoření
 * @returns Vytvořená lekce
 */
export async function createLesson(courseId: string, moduleId: string, lesson: Lesson): Promise<Lesson> {
  try {
    const response = await fetch(`/api/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        ...lesson,
        moduleId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    const createdLesson = await response.json();
    return createdLesson;
  } catch (error) {
    console.error('Chyba při vytváření lekce:', error);
    throw error;
  }
}

/**
 * Aktualizuje lekci
 * @param courseId ID kurzu
 * @param moduleId ID modulu
 * @param lesson Lekce k aktualizaci
 * @returns Aktualizovaná lekce
 */
export async function updateLesson(courseId: string, moduleId: string, lesson: Lesson): Promise<Lesson> {
  try {
    const response = await fetch(`/api/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        ...lesson,
        moduleId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    const updatedLesson = await response.json();
    return updatedLesson;
  } catch (error) {
    console.error('Chyba při aktualizaci lekce:', error);
    throw error;
  }
}

/**
 * Smaže lekci
 * @param courseId ID kurzu
 * @param moduleId ID modulu
 * @param lessonId ID lekce
 * @returns True, pokud byla lekce úspěšně smazána
 */
export async function deleteLesson(courseId: string, moduleId: string, lessonId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Chyba při mazání lekce:', error);
    throw error;
  }
}

/**
 * Přímá aktualizace jedné lekce bez ukládání celého kurzu
 * @param lesson Lekce k aktualizaci
 * @returns Aktualizovaná lekce
 */
export async function saveLesson(lesson: Lesson): Promise<Lesson> {
  try {
    console.log(`Přímá aktualizace lekce ${lesson.id}`);
    
    if (lesson.materials && lesson.materials.length > 0) {
      console.log(`Lekce obsahuje ${lesson.materials.length} materiálů:`, 
        JSON.stringify(lesson.materials.map(m => ({ type: m.type, title: m.title, url: m.url?.substring(0, 30) + '...' }))));
    } else {
      console.log(`Lekce neobsahuje žádné materiály`);
    }
    
    // Použití moderního fetch API pro rychlejší ukládání
    const response = await fetch(`/api/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      credentials: 'include',
      body: JSON.stringify(lesson)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status} - ${response.statusText}`);
    }
    
    const updatedLesson = await response.json();
    console.log(`Lekce ${lesson.id} úspěšně aktualizována`);
    
    // Invalidate cache pro tuto lekci
    apiCache.delete(`lesson-${lesson.id}`);
    
    return updatedLesson;
    
  } catch (error) {
    console.error('Chyba při aktualizaci lekce:', error);
    throw error;
  }
}

/**
 * Batch update pro více lekcí najednou (optimalizace pro velké množství změn)
 * @param lessons Pole lekcí k aktualizaci
 * @returns Pole aktualizovaných lekcí
 */
export async function saveLessonsBatch(lessons: Lesson[]): Promise<Lesson[]> {
  try {
    console.log(`Batch update pro ${lessons.length} lekcí`);
    
    if (lessons.length === 0) {
      return [];
    }
    
    // Rozdělíme lekce do batchů po 10 (aby se nepřetížil server)
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < lessons.length; i += batchSize) {
      batches.push(lessons.slice(i, i + batchSize));
    }
    
    console.log(`Rozděluji ${lessons.length} lekcí do ${batches.length} batchů`);
    
    const results: Lesson[] = [];
    
    // Zpracujeme každý batch paralelně
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Zpracovávám batch ${i + 1}/${batches.length} s ${batch.length} lekcemi`);
      
      // Paralelně uložíme všechny lekce v batchi
      const batchPromises = batch.map(lesson => saveLesson(lesson));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Krátká pauza mezi batchi (100ms)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Batch update dokončen: ${results.length} lekcí úspěšně uloženo`);
    return results;
    
  } catch (error) {
    console.error('Chyba při batch update lekcí:', error);
    throw error;
  }
}
