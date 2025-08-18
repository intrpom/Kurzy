'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { checkCourseAccess, addFreeCourseToUser, redirectToCourse } from '@/api/userCourses';
import {
  LoadingButton,
  StartCourseButton,
  GetFreeCourseButton,
  ConfirmationDialog,
  BuyCourseButton,
  GuestButton
} from './CourseAccessButtonStates';

interface CourseAccessButtonProps {
  courseId: string;
  slug: string;
  price: number;
}

/**
 * Komponenta pro zobrazení tlačítka pro přístup ke kurzu
 * Zobrazuje různé stavy podle toho, zda je uživatel přihlášen, má přístup ke kurzu a podle ceny kurzu
 */
export default function CourseAccessButton({ courseId, slug, price }: CourseAccessButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Kontrola, zda má uživatel přístup ke kurzu
  useEffect(() => {
    const fetchCourseAccess = async () => {
      // Pokud není uživatel přihlášen, nemá přístup
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);
        console.log('Kontrola přístupu ke kurzu:', courseId, 'pro uživatele:', user.id);
        
        const { hasAccess: userHasAccess } = await checkCourseAccess(courseId);
        setHasAccess(userHasAccess);
      } catch (error) {
        console.error('Chyba při kontrole přístupu ke kurzu:', error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (user && !loading) {
      fetchCourseAccess();
    } else if (!loading) {
      setHasAccess(false);
    }
  }, [user, loading, courseId]);

  // Funkce pro přímý přístup ke kurzu
  const handleAccessCourse = async () => {
    try {
      console.log('Zpracování přístupu ke kurzu:', { courseId, slug, price, hasAccess, isLoggedIn: !!user });
      
      // Pokud je kurz zdarma a uživatel je přihlášen a nemá přístup, nejprve zobrazíme potvrzení
      if (price === 0 && user && !hasAccess) {
        // Pokud není zobrazené potvrzení, zobrazíme ho
        if (!showConfirmation) {
          setShowConfirmation(true);
          return;
        }
        
        // Pokud je zobrazené potvrzení, pokračujeme s přidáním kurzu
        console.log('Přidávám kurz zdarma uživateli:', { userId: user.id, courseId });
        
        try {
          // Přidáme kurz uživateli
          const response = await addFreeCourseToUser(courseId);
          
          // Kontrola, zda se kurz úspěšně přidal
          if (!response.success) {
            throw new Error(response.message || 'Nepodařilo se přidat kurz');
          }
          
          console.log('Kurz byl úspěšně přidán uživateli');
          
          // Aktualizujeme stav přístupu
          setHasAccess(true);
        } catch (error) {
          console.error('Chyba při přidávání kurzu:', error);
          alert('Nepodařilo se přidat kurz. Zkuste to prosím později.');
          return;
        }
      }
      
      // Pokud je uživatel přihlášen a má přístup ke kurzu, přesměrujeme ho na stránku kurzu
      if (user && hasAccess) {
        console.log('Přesměrovávám na stránku kurzu:', `/moje-kurzy/${slug}`);
        redirectToCourse(slug, courseId);
      }
    } catch (error) {
      console.error('Chyba při získávání přístupu ke kurzu:', error);
      alert('Nepodařilo se získat přístup ke kurzu. Zkuste to prosím později.');
    }
  };

  // Vykreslení tlačítka podle stavu
  
  // Stav načítání
  if (loading || checkingAccess) {
    return <LoadingButton />;
  }

  // Uživatel má přístup ke kurzu
  if (hasAccess) {
    return <StartCourseButton onClick={handleAccessCourse} />;
  }

  // Uživatel je přihlášen, ale nemá přístup ke kurzu
  if (user) {
    if (price === 0) {
      // Pro kurzy zdarma
      if (showConfirmation) {
        return (
          <ConfirmationDialog 
            onConfirm={handleAccessCourse}
            onCancel={() => setShowConfirmation(false)}
            isLoading={checkingAccess}
          />
        );
      }
      
      return <GetFreeCourseButton onClick={handleAccessCourse} disabled={checkingAccess} />;
    } else {
      // Pro placené kurzy
      return <BuyCourseButton courseId={courseId} slug={slug} />;
    }
  }

  // Uživatel není přihlášen
  return <GuestButton courseId={courseId} slug={slug} />;
}
