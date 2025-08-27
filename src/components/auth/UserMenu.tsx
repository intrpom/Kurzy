'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';

const UserMenu = () => {
  const { user, loading, isInitialized, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Pokud není inicializováno, optimisticky zobrazíme login (rychlejší UX)
  if (!isInitialized || loading) {
    return (
      <Link href="/auth/login" prefetch={false} className="flex items-center gap-2 text-sm hover:text-primary-600">
        <FiUser className="text-lg" />
        <span>Přihlásit se</span>
      </Link>
    );
  }

  // Po inicializaci - pokud není uživatel, zobrazíme přihlášení
  if (!user) {
    return (
      <Link href="/auth/login" prefetch={false} className="flex items-center gap-2 text-sm hover:text-primary-600">
        <FiUser className="text-lg" />
        <span>Přihlásit se</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={toggleMenu}
        className="flex items-center gap-2 text-sm hover:text-primary-600 focus:outline-none"
      >
        <FiUser className="text-lg" />
        <span className="max-w-[150px] truncate">{user.name || user.email}</span>
        <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-neutral-200">
          <div className="px-4 py-2 border-b border-neutral-100">
            <p className="font-medium truncate">{user.name || 'Uživatel'}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
          
          <Link 
            href="/profil" 
            prefetch={false}
            className="block px-4 py-2 text-sm hover:bg-neutral-50"
            onClick={() => setIsOpen(false)}
          >
            Můj profil
          </Link>
          
          <Link 
            href="/moje-kurzy" 
            prefetch={false}
            className="block px-4 py-2 text-sm hover:bg-neutral-50"
            onClick={() => setIsOpen(false)}
          >
            Moje kurzy
          </Link>
          
          {user.role === 'admin' && (
            <Link 
              href="/admin" 
              prefetch={false}
              className="block px-4 py-2 text-sm hover:bg-neutral-50"
              onClick={() => setIsOpen(false)}
            >
              Administrace
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50 flex items-center gap-2"
          >
            <FiLogOut className="text-sm" />
            <span>Odhlásit se</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
