'use client';

import { FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  courseId: string;
  slug: string;
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
        <>Načítám přístup...</>
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
          {isLoading ? "Načítám..." : "Ano, získat kurz"}
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
 * Tlačítko pro koupi kurzu
 */
export function BuyCourseButton({ courseId, slug }: ButtonProps) {
  return (
    <Link 
      href={`/platba?courseId=${courseId}&slug=${slug}`}
      className="btn-primary inline-flex items-center"
    >
      Koupit kurz <FiArrowRight className="ml-2" />
    </Link>
  );
}

/**
 * Tlačítko pro nepřihlášené uživatele
 */
export function GuestButton({ courseId, slug }: ButtonProps) {
  // Zjistíme, zda jsme na stránce detailu kurzu nebo na seznamu kurzů
  const isDetailPage = typeof window !== 'undefined' && window.location.pathname.includes(`/kurzy/${slug}`);
  const price = 0; // Toto by mělo být předáno jako prop
  
  return (
    <Link 
      href={isDetailPage ? `/auth/login?courseId=${courseId}&slug=${slug}` : `/kurzy/${slug}`}
      className="btn-primary inline-flex items-center"
    >
      {price === 0 ? 'Získat zdarma' : 'Koupit kurz'} <FiArrowRight className="ml-2" />
    </Link>
  );
}
