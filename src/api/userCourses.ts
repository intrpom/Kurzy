'use client';

/**
 * API funkce pro práci s kurzy uživatele
 */

import { courseAccessCache } from '@/lib/course-access-cache';

/**
 * Kontroluje, zda má uživatel přístup ke konkrétnímu kurzu
 * @param courseId ID kurzu
 * @returns Informace o přístupu uživatele ke kurzu
 */
export async function checkCourseAccess(courseId: string): Promise<{ hasAccess: boolean }> {
  try {
    const result = await courseAccessCache.checkAccess(courseId);
    return { hasAccess: result.hasAccess };
  } catch (error) {
    console.error('Chyba při kontrole přístupu ke kurzu:', error);
    throw error;
  }
}

/**
 * Přidá kurz do seznamu kurzů uživatele (pro kurzy zdarma)
 * @param courseId ID kurzu
 * @returns Výsledek operace
 */
export async function addFreeCourseToUser(courseId: string): Promise<{ success: boolean, message?: string }> {
  try {
    
    // Použijeme XMLHttpRequest pro lepší podporu cookies
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              
              // Vymaž cache po úspěšném přidání kurzu
              courseAccessCache.clearCache();
              
              resolve(responseData);
            } catch (error) {
              console.error('Chyba při parsování odpovědi:', error);
              reject(new Error('Chyba při parsování odpovědi'));
            }
          } else {
            console.error('HTTP chyba při přidávání kurzu:', xhr.status);
            reject(new Error(`HTTP chyba: ${xhr.status}`));
          }
        }
      };
      
      xhr.open('POST', '/api/user/courses/add', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      
      xhr.send(JSON.stringify({ courseId }));
    });
  } catch (error) {
    console.error('Chyba při přidávání kurzu:', error);
    throw error;
  }
}

/**
 * Přesměruje uživatele na stránku kurzu
 * @param slug Slug kurzu
 * @param courseId ID kurzu
 */
export function redirectToCourse(slug: string, courseId: string): void {
  // Použijeme window.location.href pro jednoduché přesměrování
  // Server-side načítání už nepotřebuje URL parametry
  window.location.href = `/moje-kurzy/${slug}`;
}
