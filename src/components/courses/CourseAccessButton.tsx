'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { checkCourseAccess, addFreeCourseToUser, redirectToCourse } from '@/api/userCourses';
import {
  LoadingButton,
  StartCourseButton,
  GetFreeCourseButton,
  BuyCourseButton,
  GuestButton
} from './CourseAccessButtonStates';

interface CourseAccessButtonProps {
  courseId: string;
  slug: string;
  price: number;
  hasAccess?: boolean;
  loadingAccess?: boolean;
}

/**
 * Komponenta pro zobrazení tlačítka pro přístup ke kurzu
 * Zobrazuje různé stavy podle toho, zda je uživatel přihlášen, má přístup ke kurzu a podle ceny kurzu
 */
export default function CourseAccessButton({ 
  courseId, 
  slug, 
  price, 
  hasAccess: providedHasAccess = false,
  loadingAccess = false 
}: CourseAccessButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [addingCourse, setAddingCourse] = useState<boolean>(false);
  
  // Použít poskytnuté batch data
  const hasAccess = user ? providedHasAccess : false;
  
  // DEBUG: Log pro CourseAccessButton
  console.log('🎯 CourseAccessButton Debug:', {
    slug,
    price,
    user: !!user,
    loading,
    hasAccess,
    providedHasAccess,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  // Funkce pro přímý přístup ke kurzu
  const handleAccessCourse = async () => {
    try {
      
      // Pokud je kurz zdarma a uživatel je přihlášen a nemá přístup
      if (price === 0 && user && !hasAccess) {
        // Začneme loading okamžitě při prvním kliknutí
        setAddingCourse(true);
        
        try {
          // Přidáme kurz uživateli
          const response = await addFreeCourseToUser(courseId);
          
          // Kontrola, zda se kurz úspěšně přidal
          if (!response.success) {
            throw new Error(response.message || 'Nepodařilo se přidat kurz');
          }
          
          
          // Kurz byl přidán úspěšně - reloadneme stránku pro refresh batch dat
          window.location.reload();
          
          // Malé zpoždění a pak přesměrování
          setTimeout(() => {
            redirectToCourse(slug, courseId);
          }, 500);
        } catch (error) {
          console.error('Chyba při přidávání kurzu:', error);
          alert('Nepodařilo se přidat kurz. Zkuste to prosím později.');
          return;
        } finally {
          setAddingCourse(false);
        }
      }
      
      // Pokud je uživatel přihlášen a má přístup ke kurzu, přesměrujeme ho na stránku kurzu
      if (user && hasAccess) {
        redirectToCourse(slug, courseId);
      }
    } catch (error) {
      console.error('Chyba při získávání přístupu ke kurzu:', error);
      alert('Nepodařilo se získat přístup ke kurzu. Zkuste to prosím později.');
    }
  };

  // Vykreslení tlačítka podle stavu
  
  // Načítání batch dat
  if (loadingAccess) {
    return <LoadingButton />;
  }
  
  // Načítání autentizace - ale jen pokud už víme, že user existuje
  if (loading && user) {
    return <LoadingButton />;
  }

  // Uživatel má přístup ke kurzu
  if (user && hasAccess) {
    return <StartCourseButton onClick={handleAccessCourse} />;
  }

  // Uživatel je přihlášen, ale nemá přístup ke kurzu
  if (user) {
    if (price === 0) {
      // Pro kurzy zdarma
      return <GetFreeCourseButton onClick={handleAccessCourse} disabled={addingCourse} />;
    } else {
      // Pro placené kurzy - VŽDY BuyCourseButton pro přihlášené uživatele
      return <BuyCourseButton courseId={courseId} slug={slug} price={price} title={`Kurz ${slug}`} />;
    }
  }

  // Uživatel SKUTEČNĚ není přihlášen (loading = false, user = null)
  return <GuestButton courseId={courseId} slug={slug} price={price} title={`Kurz ${slug}`} />;
}
