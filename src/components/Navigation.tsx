'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import UserMenu from '@/components/auth/UserMenu';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-serif font-bold text-neutral-900 no-underline">
            Aleš Kalina
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex space-x-8 mr-8">
              <Link href="/" className="text-neutral-800 hover:text-primary-600 font-medium no-underline">
                Domů
              </Link>
              <Link href="/kurzy" className="text-neutral-800 hover:text-primary-600 font-medium no-underline">
                Kurzy
              </Link>
              <Link href="/blog" className="text-neutral-800 hover:text-primary-600 font-medium no-underline">
                Blog
              </Link>
              <Link href="/o-mne" className="text-neutral-800 hover:text-primary-600 font-medium no-underline">
                O mně
              </Link>
              <Link href="/kontakt" className="text-neutral-800 hover:text-primary-600 font-medium no-underline">
                Kontakt
              </Link>
            </div>
            <UserMenu />
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-neutral-800 focus:outline-none"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-neutral-800 hover:text-primary-600 font-medium no-underline"
                onClick={() => setIsMenuOpen(false)}
              >
                Domů
              </Link>
              <Link 
                href="/kurzy" 
                className="text-neutral-800 hover:text-primary-600 font-medium no-underline"
                onClick={() => setIsMenuOpen(false)}
              >
                Kurzy
              </Link>
              <Link 
                href="/blog" 
                className="text-neutral-800 hover:text-primary-600 font-medium no-underline"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/o-mne" 
                className="text-neutral-800 hover:text-primary-600 font-medium no-underline"
                onClick={() => setIsMenuOpen(false)}
              >
                O mně
              </Link>
              <Link 
                href="/kontakt" 
                className="text-neutral-800 hover:text-primary-600 font-medium no-underline"
                onClick={() => setIsMenuOpen(false)}
              >
                Kontakt
              </Link>
              <div className="pt-2 border-t border-neutral-100">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
