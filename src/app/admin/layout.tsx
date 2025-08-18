'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiBook, FiUsers, FiSettings, FiLogOut, FiDatabase, FiVideo } from 'react-icons/fi';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:bg-neutral-50';
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 shadow-sm">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-xl font-serif font-bold">Admin Panel</h1>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/admin" 
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin')}`}
              >
                <FiHome className="mr-3" /> Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/kurzy" 
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/kurzy')}`}
              >
                <FiBook className="mr-3" /> Kurzy
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/blog" 
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/blog')}`}
              >
                <FiVideo className="mr-3" /> Blog
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/uzivatele" 
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/uzivatele')}`}
              >
                <FiUsers className="mr-3" /> Uživatelé
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/zalohy" 
                className={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/zalohy')}`}
              >
                <FiDatabase className="mr-3" /> Zálohování
              </Link>
            </li>
            <li>
              <div className="flex items-center px-4 py-2 rounded-md text-neutral-400 cursor-not-allowed">
                <FiSettings className="mr-3" /> Nastavení
              </div>
            </li>
          </ul>
          
          <div className="mt-8 pt-4 border-t border-neutral-200">
            <Link 
              href="/" 
              className="flex items-center px-4 py-2 rounded-md text-neutral-600 hover:bg-neutral-50"
            >
              <FiLogOut className="mr-3" /> Odhlásit se
            </Link>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white border-b border-neutral-200 p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Administrace kurzů</h2>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
