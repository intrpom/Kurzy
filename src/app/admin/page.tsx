'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiBook, FiUsers, FiActivity, FiRefreshCw } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalModules: 0,
    totalLessons: 0
  });
  
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidateMessage, setRevalidateMessage] = useState('');
  
  // Funkce pro vymazání cache všech kurzů
  const revalidateCache = async () => {
    setIsRevalidating(true);
    setRevalidateMessage('');
    
    try {
      // Získání tajného klíče z proměnné prostředí (v produkci)
      // V lokálním prostředí použijeme výchozí hodnotu
      // POZNÁMKA: Musí být NEXT_PUBLIC_ aby byl dostupný na klientovi
      const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'tajny-klic-pro-revalidaci';
      
      // Volání API pro vymazání cache všech kurzů
      const response = await fetch(`/api/revalidate?path=/kurzy&secret=${secret}`);
      const data = await response.json();
      
      if (response.ok) {
        setRevalidateMessage('Cache byla úspěšně vymazána! Změny jsou nyní viditelné na webu.');
      } else {
        setRevalidateMessage(`Chyba: ${data.message || 'Nepodařilo se vymazat cache'}`); 
      }
    } catch (error) {
      setRevalidateMessage(`Chyba: ${error instanceof Error ? error.message : 'Nepodařilo se vymazat cache'}`); 
    } finally {
      setIsRevalidating(false);
    }
  };
  
  useEffect(() => {
    // Načtení statistik z API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/courses?includeDetails=true');
        if (response.ok) {
          const courses = await response.json();
          
          let moduleCount = 0;
          let lessonCount = 0;
          
          courses.forEach((course: any) => {
            // Kontrola, zda kurz má definované moduly
            if (course.modules && Array.isArray(course.modules)) {
              moduleCount += course.modules.length;
              
              // Procházení modulů a kontrola, zda modul má definované lekce
              course.modules.forEach((module: any) => {
                if (module.lessons && Array.isArray(module.lessons)) {
                  lessonCount += module.lessons.length;
                }
              });
            }
          });
          
          setStats({
            totalCourses: courses.length,
            totalModules: moduleCount,
            totalLessons: lessonCount
          });
        }
      } catch (error) {
        console.error('Chyba při načítání statistik:', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-serif font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-50 rounded-full mr-4">
              <FiBook className="text-primary-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Celkem kurzů</p>
              <h3 className="text-2xl font-bold">{stats.totalCourses}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full mr-4">
              <FiActivity className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Celkem modulů</p>
              <h3 className="text-2xl font-bold">{stats.totalModules}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Celkem lekcí</p>
              <h3 className="text-2xl font-bold">{stats.totalLessons}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Rychlé akce</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/admin/kurzy/novy" 
            className="p-4 border border-neutral-200 rounded-md hover:bg-neutral-50 flex items-center"
          >
            <div className="p-3 bg-primary-50 rounded-full mr-4">
              <FiBook className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium">Vytvořit nový kurz</h3>
              <p className="text-sm text-neutral-500">Přidat nový kurz do systému</p>
            </div>
          </Link>
          
          <Link 
            href="/admin/kurzy" 
            className="p-4 border border-neutral-200 rounded-md hover:bg-neutral-50 flex items-center"
          >
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <FiActivity className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Spravovat kurzy</h3>
              <p className="text-sm text-neutral-500">Upravit existující kurzy</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Sekce pro reset cache */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-xl font-medium mb-4">Správa cache</h2>
        <p className="text-neutral-600 mb-4">
          Po vytvoření nebo úpravě kurzu je potřeba vymazat cache, aby se změny projevily na webu.
          Tlačítko níže vymazává cache pro všechny kurzy najednou.          
        </p>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={revalidateCache}
            disabled={isRevalidating}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isRevalidating ? (
              <>
                <FiRefreshCw className="animate-spin mr-2" /> 
                Probíhá vymazávání cache...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" /> 
                Vymazat cache všech kurzů
              </>
            )}
          </button>
          
          {revalidateMessage && (
            <div className={`p-3 rounded-md ${revalidateMessage.includes('Chyba') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {revalidateMessage}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
