'use client';

/**
 * API funkce pro práci se seznamem kurzů v administraci
 */

import { Course } from '@/types/course';

/**
 * Načte seznam všech kurzů
 * @returns Seznam kurzů
 */
export async function loadCourseList(): Promise<Course[]> {
  try {
    const response = await fetch('/api/courses?includeDetails=true', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Chyba při načítání seznamu kurzů:', error);
    throw error;
  }
}

/**
 * Vytvoří nový kurz
 * @returns Vytvořený kurz
 */
export async function createCourse(): Promise<Course> {
  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        title: 'Nový kurz',
        slug: `novy-kurz-${Date.now()}`,
        description: 'Popis nového kurzu',
        price: 0,
        isFeatured: false,
        tags: [],
        modules: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP chyba: ${response.status}`);
    }
    
    const course = await response.json();
    return course;
  } catch (error) {
    console.error('Chyba při vytváření kurzu:', error);
    throw error;
  }
}

/**
 * Smaže kurz
 * @param id ID kurzu
 * @returns True, pokud byl kurz úspěšně smazán
 */
export async function deleteCourse(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/courses/${id}`, {
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
    console.error('Chyba při mazání kurzu:', error);
    throw error;
  }
}
