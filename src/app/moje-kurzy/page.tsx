'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MainLayout from '@/app/MainLayout';
import { FiArrowRight, FiClock, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import CourseImage from '@/components/CourseImage';

// Typy pro data kurzů
interface LastLesson {
  title: string;
  module: string;
}

interface UserCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastLesson: LastLesson | null;
}

interface AvailableCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  isFree: boolean;
}

export default function MyCoursesPage() {
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Funkce pro načtení dat kurzů
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/courses', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst data kurzů');
        }
        
        const data = await response.json();
        setUserCourses(data.userCourses || []);
        setAvailableCourses(data.availableCourses || []);
      } catch (err) {
        console.error('Chyba při načítání kurzů:', err);
        setError('Nepodařilo se načíst data kurzů');
      } finally {
        setLoading(false);
      }
    };

    // Načíst data pouze pokud je uživatel přihlášen
    if (user) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">Moje kurzy</h1>
          <p className="text-lg text-neutral-700 text-center max-w-2xl mx-auto mt-4">
            Vítejte ve vašem osobním prostoru pro vzdělávání. Zde najdete všechny své kurzy a můžete pokračovat ve studiu.
          </p>
        </div>
      </section>

      {/* My Courses */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-serif font-bold mb-6">Vaše kurzy</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <FiAlertCircle className="text-red-500 text-3xl mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
                Zkusit znovu
              </button>
            </div>
          ) : !user ? (
            <div className="bg-neutral-50 p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">Pro zobrazení kurzů se přihlaste</h3>
              <p className="text-neutral-600 mb-4">
                Pro přístup k vašim kurzům se prosím přihlaste do svého účtu.
              </p>
              <Link href="/auth/login" className="btn-primary">
                Přihlásit se
              </Link>
            </div>
          ) : userCourses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {userCourses.map((course: UserCourse) => (
                <div key={course.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="flex flex-col">
                    <div className="relative w-full">
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          alt={course.title} 
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center">
                          <span className="text-primary-800 font-serif text-lg">Obrázek kurzu</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
                      <div className="flex items-center text-sm text-neutral-600 mb-4">
                        <FiClock className="mr-1" />
                        <span>Dokončeno {course.lessonsCompleted} z {course.totalLessons} lekcí</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Pokrok</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 rounded-full">
                          <div 
                            className="h-full bg-primary-600 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mb-4 p-3 bg-neutral-50 rounded-md">
                        <p className="text-sm text-neutral-600 mb-1">Poslední lekce:</p>
                        {course.lastLesson ? (
                          <>
                            <p className="font-medium">{course.lastLesson.title}</p>
                            <p className="text-sm text-neutral-500">{course.lastLesson.module}</p>
                          </>
                        ) : (
                          <p className="font-medium">Žádná lekce není k dispozici</p>
                        )}
                      </div>
                      
                      <Link 
                        href={`/moje-kurzy/${course.slug || course.id}`} 
                        className="btn-primary inline-flex items-center"
                      >
                        Pokračovat v kurzu <FiArrowRight className="ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">{user ? 'Zatím nemáte žádné kurzy' : 'Pro zobrazení kurzů se přihlaste'}</h3>
              <p className="text-neutral-600 mb-4">
                {user ? 'Prozkoumejte naši nabídku kurzů a začněte svou vzdělávací cestu.' : 'Pro přístup k vašim kurzům se prosím přihlaste do svého účtu.'}
              </p>
              <Link href={user ? '/kurzy' : '/auth/login'} className="btn-primary">
                {user ? 'Prozkoumat kurzy' : 'Přihlásit se'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Courses */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-2xl font-serif font-bold mb-6">Doporučené kurzy</h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableCourses.map((course: AvailableCourse) => (
                <div key={course.id} className="card">
                <div className="relative h-48 bg-neutral-100">
                  {course.imageUrl ? (
                    <div className="relative" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <CourseImage 
                        src={course.imageUrl} 
                        alt={course.title}
                        width={400}
                        height={225}
                        className="rounded-t-lg"
                      />
                    </div>
                  ) : null}
                  <div className="absolute top-4 right-4 bg-primary-600 text-white text-sm font-medium px-2 py-1 rounded">
                    {course.isFree ? 'Zdarma' : `${course.price} Kč`}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
                  <p className="text-neutral-700 mb-4">
                    {course.description.length > 200 
                      ? `${course.description.substring(0, 200)}...` 
                      : course.description
                    }
                  </p>
                  <Link 
                    href={`/kurzy/${course.slug || course.id}`} 
                    className="btn-outline inline-flex items-center"
                  >
                    Zobrazit detail <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">{user ? 'Žádné další kurzy k dispozici' : 'Pro zobrazení kurzů se přihlaste'}</h3>
              <p className="text-neutral-600 mb-4">
                {user ? 'Všechny dostupné kurzy již máte ve své knihovně.' : 'Pro přístup k nabídce kurzů se prosím přihlaste do svého účtu.'}
              </p>
              <Link href={user ? '/kurzy' : '/auth/login'} className="btn-primary">
                {user ? 'Zpět na moje kurzy' : 'Přihlásit se'}
              </Link>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
