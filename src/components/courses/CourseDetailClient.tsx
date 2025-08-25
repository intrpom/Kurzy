'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface CourseDetailClientProps {
  courseId: string;
  slug: string;
  price: number;
  children: React.ReactNode;
}

export default function CourseDetailClient({ courseId, slug, price, children }: CourseDetailClientProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pokud je kurz zdarma a uživatel je přihlášen, automaticky přidáme kurz uživateli a přesměrujeme ho
    const handleFreeCourseAccess = async () => {
      // Pokud není kurz zdarma, uživatel není přihlášen, nebo již probíhá zpracování, nepokračujeme
      if (!user || loading || price !== 0 || isProcessing) return;
      
      // Kontrola - pokud uživatel záměrně navštívil hlavní stránku kurzu, neprovádíme automatické přesměrování
      if (window.location.pathname.startsWith('/kurzy/')) {
        return;
      }

      try {
        setIsProcessing(true);
        setError(null);
        
        // Nejprve zkontrolujeme, zda uživatel již má přístup ke kurzu
        const checkResponse = await fetch(`/api/user/courses?courseId=${courseId}`);
        
        if (!checkResponse.ok) {
          throw new Error(`Chyba při kontrole přístupu: ${checkResponse.status}`);
        }
        
        const checkData = await checkResponse.json();
        
        // Pokud uživatel již má přístup, přesměrujeme ho na stránku kurzu
        if (checkData.hasAccess) {
          // Použijeme window.location místo router.replace pro úplné přesměrování
          window.location.href = `/moje-kurzy/${slug}`;
          return;
        }
        
        // Pokud uživatel nemá přístup, přidáme mu ho
        const response = await fetch('/api/user/courses/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId }),
          credentials: 'include', // Zajistíme odeslání cookies
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Chyba při přidávání kurzu: ${response.status} - ${errorText}`);
        }

        // Použijeme window.location místo router.replace pro úplné přesměrování
        window.location.href = `/moje-kurzy/${slug}`;
      } catch (error) {
        console.error('Chyba při zpracování přístupu ke kurzu zdarma:', error);
        setError(error instanceof Error ? error.message : 'Neznámá chyba');
        setIsProcessing(false);
      }
    };

    // Spustíme kontrolu přístupu ke kurzu zdarma s malým zpožděním,
    // abychom zajistili, že se stránka nejprve načte
    const timer = setTimeout(() => {
      handleFreeCourseAccess();
    }, 300);

    return () => clearTimeout(timer);
  }, [user, loading, courseId, slug, price, router, isProcessing]);

  // Pokud nastala chyba, zobrazíme ji uživateli
  if (error) {
    return (
      <>
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white p-4 text-center z-50">
          {error}
        </div>
        {children}
      </>
    );
  }

  // Pokud probíhá zpracování, můžeme zobrazit indikátor načítání
  if (isProcessing && user && price === 0) {
    return (
      <>
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-80 z-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-lg">Připravujeme váš kurz...</p>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
