'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, isInitialized } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Počkáme, až se autentifikace inicializuje
    if (!isInitialized) {
      return;
    }

    setIsChecking(false);

    // Pokud uživatel není přihlášen, přesměruj na login
    if (!user) {
      console.log('AdminGuard: Uživatel není přihlášen, přesměrovávám na login');
      router.push('/auth/login?redirect=/admin');
      return;
    }

    // Pokud uživatel není admin, přesměruj na hlavní stránku
    if (user.role !== 'ADMIN') {
      console.log('AdminGuard: Uživatel není admin, přesměrovávám na hlavní stránku');
      router.push('/');
      return;
    }

    console.log('AdminGuard: Uživatel je admin, povolujeme přístup');
  }, [user, loading, isInitialized, router]);

  // Zobrazíme loading během inicializace nebo kontroly
  if (loading || isChecking || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Ověřuji oprávnění...</p>
        </div>
      </div>
    );
  }

  // Pokud uživatel není přihlášen nebo není admin, nezobrazujeme obsah
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Přístup odepřen</h1>
          <p className="text-neutral-600 mb-4">Nemáte oprávnění k přístupu do administrace.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    );
  }

  // Uživatel je admin, zobrazíme obsah
  return <>{children}</>;
}
