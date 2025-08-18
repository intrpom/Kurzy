'use client';

/**
 * API funkce pro práci s kurzy uživatele
 */

/**
 * Kontroluje, zda má uživatel přístup ke konkrétnímu kurzu
 * @param courseId ID kurzu
 * @returns Informace o přístupu uživatele ke kurzu
 */
export async function checkCourseAccess(courseId: string): Promise<{ hasAccess: boolean }> {
  try {
    console.log('Kontrola přístupu ke kurzu:', courseId);
    
    // Použijeme XMLHttpRequest pro lepší podporu cookies
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true; // Důležité pro cross-origin požadavky s cookies
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('XHR odpověď:', { status: xhr.status, responseText: xhr.responseText });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              
              // Kontrola, zda má uživatel přístup ke kurzu
              let userHasAccess = false;
              
              // Kontrola, zda API vrátilo informaci o přístupu
              if (responseData.hasAccess === true) {
                userHasAccess = true;
              }
              
              // Kontrola, zda kurz existuje v seznamu kurzů uživatele
              if (responseData.courses && Array.isArray(responseData.courses)) {
                const userCourse = responseData.courses.find((course: any) => course.id === courseId);
                if (userCourse) {
                  userHasAccess = true;
                }
              }
              
              console.log(userHasAccess ? 'Uživatel má přístup ke kurzu' : 'Uživatel nemá přístup ke kurzu');
              resolve({ hasAccess: userHasAccess });
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
      
      xhr.open('GET', `/api/user/courses?courseId=${courseId}`, true);
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Expires', '0');
      xhr.send();
    });
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
    console.log('Přidávám kurz zdarma uživateli, courseId:', courseId);
    
    // Použijeme XMLHttpRequest pro lepší podporu cookies
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('XHR odpověď:', { status: xhr.status, responseText: xhr.responseText });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
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
  // Použijeme form submit pro přesměrování, což zajistí přenos cookies
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = `/moje-kurzy/${slug}`;
  
  // Přidáme courseId jako parametr pro správnou identifikaci kurzu
  const courseIdInput = document.createElement('input');
  courseIdInput.type = 'hidden';
  courseIdInput.name = 'id';
  courseIdInput.value = courseId;
  form.appendChild(courseIdInput);
  
  // Přidáme timestamp jako parametr pro zabránění cachování
  const timestampInput = document.createElement('input');
  timestampInput.type = 'hidden';
  timestampInput.name = '_';
  timestampInput.value = Date.now().toString();
  form.appendChild(timestampInput);
  
  document.body.appendChild(form);
  console.log('Odesílám formulář pro přesměrování');
  form.submit();
}
