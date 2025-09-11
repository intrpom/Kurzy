import Link from 'next/link';
import MainLayout from '../MainLayout';
import { FiArrowRight, FiBookOpen, FiClock, FiPlay } from 'react-icons/fi';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

interface UserCourse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
  progress: number;
  totalLessons: number;
  lastLesson?: {
    title: string;
    moduleTitle: string;
  };
}

interface AvailableCourse {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  slug?: string;
  isFree: boolean;
}

// Server funkce pro získání uživatele ze session
async function getCurrentUser() {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      return null;
    }

    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      
      // Kontrola expirace
      if (sessionData.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
    } catch (sessionError) {
      return null;
    }

    // Získat aktuální data uživatele s retry logikou
    let user;
    try {
      // Zajistíme čerstvé připojení
      await prisma.$connect();
      
      user = await prisma.user.findUnique({
        where: { id: sessionData.userId || sessionData.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
    } catch (connectionError) {
      console.error('Chyba při připojení k databázi při získávání uživatele:', connectionError);
      // Zkusíme znovu s novým připojením
      await prisma.$disconnect();
      await prisma.$connect();
      
      user = await prisma.user.findUnique({
        where: { id: sessionData.userId || sessionData.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Chyba při získávání uživatele:', error);
    return null;
  }
}

// Server funkce pro získání kurzů uživatele
async function getUserCourses(userId: string): Promise<{ userCourses: UserCourse[], availableCourses: AvailableCourse[] }> {
  try {
    // Získat kurzy uživatele včetně detailů o kurzích
    const userCoursesData = await prisma.userCourse.findMany({
      where: {
        userId: userId
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Transformovat data pro frontend
    const formattedCourses = userCoursesData.map((userCourse: any) => {
      // Spočítat celkový počet lekcí
      let totalLessons = 0;
      userCourse.course.modules.forEach((module: any) => {
        totalLessons += module.lessons.length;
      });
      
      // Najít poslední lekci (pro pokračování v kurzu)
      const lastModule = userCourse.course.modules[0];
      const lastLesson = lastModule?.lessons[0];
      
      return {
        id: userCourse.course.id,
        title: userCourse.course.title,
        description: userCourse.course.description,
        imageUrl: userCourse.course.imageUrl,
        slug: userCourse.course.slug,
        progress: userCourse.progress,
        totalLessons,
        lastLesson: lastLesson ? {
          title: lastLesson.title,
          moduleTitle: lastModule.title
        } : undefined
      };
    });
    
    // Získat dostupné kurzy (které uživatel ještě nemá) - preferujeme placené
    const userCourseIds = userCoursesData.map(uc => uc.courseId);
    
    const availableCoursesData = await prisma.course.findMany({
      where: {
        id: { notIn: userCourseIds } // Kurzy, které uživatel ještě nemá
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        slug: true
      },
      orderBy: [
        { price: 'desc' }, // Nejdřív placené kurzy
        { createdAt: 'desc' } // Pak podle data vytvoření
      ],
      take: 6 // Omezíme na 6 kurzů
    });
    
    const formattedAvailableCourses = availableCoursesData.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      slug: course.slug,
      isFree: course.price === 0
    }));
    
    return {
      userCourses: formattedCourses,
      availableCourses: formattedAvailableCourses
    };
  } catch (error) {
    console.error('Chyba při načítání kurzů uživatele:', error);
    return { userCourses: [], availableCourses: [] };
  }
}

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

// Server komponenta
export default async function MyCoursesPage() {
  // Získat uživatele
  const user = await getCurrentUser();
  
  // Pokud není přihlášen, zobrazit login zprávu
  if (!user) {
    return (
      <MainLayout>
        <section className="py-16 bg-neutral-50">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Moje kurzy</h1>
              <p className="text-lg text-neutral-600 mb-8">
                Pro zobrazení vašich kurzů se prosím přihlaste do svého účtu.
              </p>
              <Link href="/auth/login" prefetch={false} className="btn-primary">
                Přihlásit se
              </Link>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  // Získat kurzy uživatele
  const { userCourses, availableCourses } = await getUserCourses(user.id);

  console.log(`👤 Uživatel ${user.name}: ${userCourses.length} kurzů, ${availableCourses.length} dostupných`);

  return (
    <MainLayout>
      {/* Header */}
      <section className="py-16 bg-neutral-50">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">Moje kurzy</h1>
        </div>
      </section>

      {/* User Courses */}
      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-serif font-bold mb-8">Vaše kurzy</h2>
          
          {userCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userCourses.map((course: UserCourse) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-neutral-100">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-4xl text-neutral-400" />
                      </div>
                    )}
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                      <div className="bg-white/20 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-white text-sm font-medium">
                        {course.progress}% dokončeno
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
                    <p className="text-neutral-700 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                      <div className="flex items-center">
                        <FiBookOpen className="mr-1" />
                        <span>{course.totalLessons} lekcí</span>
                      </div>
                      {course.lastLesson && (
                        <div className="flex items-center">
                          <FiPlay className="mr-1" />
                          <span className="truncate max-w-32">{course.lastLesson.title}</span>
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      href={`/moje-kurzy/${course.slug || course.id}`} 
                      prefetch={false}
                      className="btn-primary inline-flex items-center justify-center w-full"
                    >
                      Pokračovat v kurzu <FiArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">Zatím nemáte žádné kurzy</h3>
              <p className="text-neutral-600 mb-4">
                Prozkoumejte naši nabídku kurzů a začněte svou vzdělávací cestu.
              </p>
              <Link href="/kurzy" prefetch={false} className="btn-primary">
                Prozkoumat kurzy
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Courses */}
      {availableCourses.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="container-custom">
            <h2 className="text-2xl font-serif font-bold mb-8">Doporučené kurzy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableCourses.map((course: AvailableCourse) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-neutral-100">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-4xl text-neutral-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-2">{course.title}</h3>
                    <p className="text-neutral-700 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${course.isFree ? 'text-green-600' : 'text-secondary-600'}`}>
                        {course.isFree ? 'Zdarma' : `${course.price} Kč`}
                      </span>
                      <Link 
                        href={`/kurzy/${course.slug || course.id}`} 
                        prefetch={false} 
                        className="btn-primary"
                      >
                        Detail kurzu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}