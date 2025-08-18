'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiSettings } from 'react-icons/fi';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout pro administrátorské rozhraní
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50';
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-2xl font-serif font-bold text-primary-600">
              Admin
            </Link>
            <Link href="/" className="text-sm text-neutral-600 hover:text-primary-600">
              Zpět na web
            </Link>
          </div>
        </div>
      </header>
      
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <nav className="space-y-1">
                <Link 
                  href="/admin" 
                  className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin')}`}
                >
                  <FiHome className="mr-3" /> Dashboard
                </Link>
                <Link 
                  href="/admin/kurzy" 
                  className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/kurzy')}`}
                >
                  <FiBook className="mr-3" /> Kurzy
                </Link>
                <Link 
                  href="/admin/uzivatele" 
                  className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/uzivatele')}`}
                >
                  <FiUsers className="mr-3" /> Uživatelé
                </Link>
                <Link 
                  href="/admin/nastaveni" 
                  className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/nastaveni')}`}
                >
                  <FiSettings className="mr-3" /> Nastavení
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
