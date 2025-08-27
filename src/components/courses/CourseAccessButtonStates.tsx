'use client';

import { useState } from 'react';
import { FiArrowRight, FiCreditCard } from 'react-icons/fi';
import Link from 'next/link';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  courseId: string;
  slug: string;
  price?: number;
  title?: string;
}

/**
 * Tlačítko ve stavu načítání
 */
export function LoadingButton() {
  return (
    <button className="btn-primary inline-flex items-center opacity-75 cursor-wait" disabled>
      Načítání...
    </button>
  );
}

/**
 * Tlačítko pro zahájení kurzu (uživatel má přístup)
 */
export function StartCourseButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="btn-primary inline-flex items-center"
    >
      Zahájit kurz <FiArrowRight className="ml-2" />
    </button>
  );
}

/**
 * Tlačítko pro získání kurzu zdarma
 */
export function GetFreeCourseButton({ onClick, disabled = false }: { onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="btn-primary inline-flex items-center"
      disabled={disabled}
    >
      {disabled ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Kurz pro vás připravujeme...
        </>
      ) : (
        <>Získat zdarma <FiArrowRight className="ml-2" /></>
      )}
    </button>
  );
}

/**
 * Potvrzovací dialog pro získání kurzu zdarma
 */
export function ConfirmationDialog({ 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: { 
  onConfirm: () => void, 
  onCancel: () => void, 
  isLoading?: boolean 
}) {
  return (
    <div className="flex flex-col space-y-3">
      <p className="text-sm font-medium">Opravdu chcete získat tento kurz zdarma?</p>
      <div className="flex space-x-3">
        <button 
          onClick={onConfirm}
          className="btn-primary inline-flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Připravujeme kurz...
            </>
          ) : (
            "Ano, získat kurz"
          )}
        </button>
        <button 
          onClick={onCancel}
          className="btn-secondary inline-flex items-center"
        >
          Zrušit
        </button>
      </div>
    </div>
  );
}

/**
 * Tlačítko pro koupi kurzu s Stripe platbou
 */
export function BuyCourseButton({ courseId, slug, price = 0, title = 'Kurz' }: ButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeCheckout = async () => {
    try {
      setIsProcessing(true);
      
      // Získat data kurzu pro Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          courseSlug: slug,
          courseTitle: title,
          price: price,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Přesměrovat na Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Nepodařilo se vytvořit platební session');
      }
    } catch (error) {
      console.error('Chyba při vytváření Stripe checkout:', error);
      alert('Nepodařilo se spustit platbu. Zkuste to prosím později.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleStripeCheckout}
      disabled={isProcessing}
      className="btn-primary inline-flex items-center"
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Zpracovávám...
        </>
      ) : (
        <>
          <FiCreditCard className="mr-2" />
          Koupit kurz <FiArrowRight className="ml-2" />
        </>
      )}
    </button>
  );
}

/**
 * Tlačítko pro nepřihlášené uživatele
 */
export function GuestButton({ courseId, slug, price = 0, title = 'Kurz' }: ButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Zjistíme, zda jsme na stránce detailu kurzu nebo na seznamu kurzů
  const isDetailPage = typeof window !== 'undefined' && 
    (window.location.pathname === `/kurzy/${slug}` || window.location.pathname.startsWith(`/kurzy/${slug}/`));
  
  // DEBUG: Log pro kontrolu detekce
  console.log('🔍 GuestButton Debug:', {
    slug,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    expectedPath: `/kurzy/${slug}`,
    isDetailPage,
    price
  });
  
  // Pro placené kurzy spustíme Stripe checkout
  const handlePaidCourse = async () => {
    try {
      setIsProcessing(true);
      
      // Volání Stripe API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          courseSlug: slug,
          courseTitle: title,
          price: price,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Přesměrovat na Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Nepodařilo se vytvořit platební session');
      }
    } catch (error) {
      console.error('Chyba při vytváření Stripe checkout:', error);
      alert('Nepodařilo se spustit platbu. Zkuste to prosím později.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Pro placené kurzy přesměrujeme na přihlášení, ne přímo na Stripe
  if (price > 0) {
    return (
      <Link 
        href={`/auth/login?courseId=${courseId}&slug=${slug}&price=${price}&action=purchase`}
        className="btn-primary inline-flex items-center"
      >
        <FiCreditCard className="mr-2" />
        Koupit za {price} Kč <FiArrowRight className="ml-2" />
      </Link>
    );
  }
  
  // Pro kurzy zdarma - na seznamu ukážeme "Detail kurzu", na detailu "Získat kurz (je zdarma)"
  return (
    <Link 
      href={isDetailPage ? `/auth/login?courseId=${courseId}&slug=${slug}` : `/kurzy/${slug}`}
      prefetch={false}
      className="btn-primary inline-flex items-center"
    >
      {isDetailPage ? 'Získat kurz (je zdarma)' : 'Detail kurzu'} <FiArrowRight className="ml-2" />
    </Link>
  );
}
