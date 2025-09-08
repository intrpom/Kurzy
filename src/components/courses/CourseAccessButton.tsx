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

export interface CourseAccessButtonProps {
  courseId: string;
  slug: string;
  price: number;
  hasAccess?: boolean;
  loadingAccess?: boolean;
  isDetailPage?: boolean;
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
  loadingAccess = false,
  isDetailPage = false
}: CourseAccessButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [addingCourse, setAddingCourse] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // Detekce client-side pro prevenci hydration chyb
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Auto-detekce detail stránky
  const [isOnDetailPage, setIsOnDetailPage] = useState(isDetailPage);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDetail = window.location.pathname === `/kurzy/${slug}` || 
                      window.location.pathname.startsWith(`/kurzy/${slug}/`);
      setIsOnDetailPage(isDetail);
    }
  }, [slug, isDetailPage]);
  
  // Component mounted
  
  // Použít poskytnuté batch data
  const hasAccess = user ? providedHasAccess : false;
  
  
  // DEBUG removed - causing spam

  // Funkce pro přímý přístup ke kurzu
  const handleAccessCourse = async () => {
    // Zabránění double-click / double processing
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    
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
          
          
          // Kurz byl přidán úspěšně - přímo přesměrujeme (cache už je invalidována v addFreeCourseToUser)
          redirectToCourse(slug, courseId);
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
    } finally {
      // Reset processing flag po dokončení (s malým delay pro UX)
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  // Vykreslení tlačítka podle stavu
  
  // Načítání batch dat
  if (loadingAccess) {
    return <LoadingButton />;
  }
  
  // Načítání autentizace - čekáme na dokončení ověření
  // Pouze na client-side pro prevenci hydration chyb
  if (loading && isClient) {
    return <LoadingButton />;
  }
  
  // Na serveru nebo během prvního renderu na clientu zobrazíme loading
  if (!isClient) {
    return <LoadingButton />;
  }

  // Uživatel má přístup ke kurzu
  if (user && hasAccess) {
    return <StartCourseButton onClick={handleAccessCourse} disabled={isProcessing} />;
  }

  // Uživatel je přihlášen, ale nemá přístup ke kurzu
  if (user) {
    if (price === 0) {
      // Pro kurzy zdarma - na detail stránce zobrazit "Získat kurz", jinde "Detail kurzu"
      if (isOnDetailPage) {
        return <GetFreeCourseButton onClick={handleAccessCourse} disabled={addingCourse || isProcessing} />;
      } else {
        return <GuestButton courseId={courseId} slug={slug} price={price} title={`Kurz ${slug}`} isDetailPage={false} />;
      }
    } else {
      // Pro placené kurzy - zobrazit tlačítko pro nákup
      return <BuyCourseButton courseId={courseId} slug={slug} price={price} title={`Kurz ${slug}`} />;
    }
  }

  // Uživatel SKUTEČNĚ není přihlášen (loading = false, user = null)
  return <GuestButton courseId={courseId} slug={slug} price={price} title={`Kurz ${slug}`} isDetailPage={isOnDetailPage} />;
}
