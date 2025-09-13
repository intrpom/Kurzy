import Link from 'next/link';
import MainLayout from '../MainLayout';
import { FiArrowRight, FiPlay, FiClock, FiEye } from 'react-icons/fi';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

interface UserMiniCourse {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  slug: string;
  price: number;
  purchaseDate: string;
  duration?: number;
  views: number;
}

interface AvailableMiniCourse {
  id: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  slug: string;
  price: number;
  isPaid: boolean;
  duration: number | null;
  views: number;
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

// Server funkce pro získání minikurzů uživatele
async function getUserMiniCourses(userId: string, userRole?: string): Promise<{ userMiniCourses: UserMiniCourse[], availableMiniCourses: AvailableMiniCourse[] }> {
  try {
    let userMiniCoursesData: any[] = [];
    
    if (userRole === 'ADMIN') {
      // Admin má přístup ke všem publikovaným minikurzům
      const allBlogPosts = await prisma.blogPost.findMany({
        where: {
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          slug: true,
          thumbnailUrl: true,
          price: true,
          duration: true,
          views: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Transformovat do formátu UserMiniCourse
      userMiniCoursesData = allBlogPosts.map(post => ({
        blogPost: post,
        price: post.price, // Aktuální cena
        purchaseDate: new Date() // Fake datum pro admin
      }));
    } else {
      // Získat zakoupené minikurzy uživatele
      userMiniCoursesData = await prisma.userMiniCourse.findMany({
        where: {
          userId: userId
        },
        include: {
          blogPost: {
            select: {
              id: true,
              title: true,
              subtitle: true,
              slug: true,
              thumbnailUrl: true,
              price: true,
              duration: true,
              views: true
            }
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      });
    }
    
    // Transformovat data pro frontend
    const formattedUserMiniCourses = userMiniCoursesData.map((userMiniCourse: any) => ({
      id: userMiniCourse.blogPost.id,
      title: userMiniCourse.blogPost.title,
      subtitle: userMiniCourse.blogPost.subtitle,
      thumbnailUrl: userMiniCourse.blogPost.thumbnailUrl,
      slug: userMiniCourse.blogPost.slug,
      price: userMiniCourse.price, // Cena za kterou byl zakoupen
      purchaseDate: userMiniCourse.purchaseDate.toISOString(),
      duration: userMiniCourse.blogPost.duration,
      views: userMiniCourse.blogPost.views
    }));
    
    // Získat dostupné minikurzy (které uživatel ještě nemá)
    let availableMiniCoursesData: any[] = [];
    
    if (userRole !== 'ADMIN') {
      const userMiniCourseIds = userMiniCoursesData.map(umc => umc.blogPostId || umc.blogPost.id);
      
      availableMiniCoursesData = await prisma.blogPost.findMany({
        where: {
          id: { notIn: userMiniCourseIds }, // Minikurzy, které uživatel ještě nemá
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          slug: true,
          thumbnailUrl: true,
          price: true,
          isPaid: true,
          duration: true,
          views: true
        },
        orderBy: [
          { isPaid: 'desc' }, // Nejdřív placené minikurzy
          { publishedAt: 'desc' } // Pak podle data publikování
        ],
        take: 6 // Omezíme na 6 minikurzů
      });
    }
    
    const formattedAvailableMiniCourses = availableMiniCoursesData.map(miniCourse => ({
      id: miniCourse.id,
      title: miniCourse.title,
      subtitle: miniCourse.subtitle,
      thumbnailUrl: miniCourse.thumbnailUrl,
      slug: miniCourse.slug,
      price: miniCourse.price,
      isPaid: miniCourse.isPaid,
      duration: miniCourse.duration,
      views: miniCourse.views
    }));
    
    return {
      userMiniCourses: formattedUserMiniCourses,
      availableMiniCourses: formattedAvailableMiniCourses
    };
  } catch (error) {
    console.error('Chyba při načítání minikurzů uživatele:', error);
    return { userMiniCourses: [], availableMiniCourses: [] };
  }
}

// Pomocné funkce pro formátování
function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function formatViews(views: number): string {
  if (views < 1000) return views.toString();
  if (views < 1000000) return `${(views / 1000).toFixed(1)}k`;
  return `${(views / 1000000).toFixed(1)}M`;
}

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

// Server komponenta
export default async function MyMiniCoursesPage() {
  // Získat uživatele
  const user = await getCurrentUser();
  
  // Pokud není přihlášen, zobrazit login zprávu
  if (!user) {
    return (
      <MainLayout>
        <section className="py-16 bg-neutral-50">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Moje minikurzy</h1>
              <p className="text-lg text-neutral-600 mb-8">
                Pro zobrazení vašich minikurzů se prosím přihlaste do svého účtu.
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

  // Získat minikurzy uživatele
  const { userMiniCourses, availableMiniCourses } = await getUserMiniCourses(user.id, user.role);

  console.log(`👤 Uživatel ${user.name}: ${userMiniCourses.length} minikurzů, ${availableMiniCourses.length} dostupných`);

  return (
    <MainLayout>
      {/* Header */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center">Moje minikurzy</h1>
        </div>
      </section>

      {/* User Mini Courses */}
      <section className="py-8">
        <div className="container-custom">
          {userMiniCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userMiniCourses.map((miniCourse: UserMiniCourse) => (
                <div key={miniCourse.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-neutral-100">
                    {miniCourse.thumbnailUrl ? (
                      <img 
                        src={miniCourse.thumbnailUrl} 
                        alt={miniCourse.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                        <FiPlay className="text-4xl text-white" />
                      </div>
                    )}
                    {/* Purchased Badge */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {user?.role === 'ADMIN' ? 'Admin přístup' : 'Zakoupeno'}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-2">{miniCourse.title}</h3>
                    {miniCourse.subtitle && (
                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {miniCourse.subtitle}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                      {miniCourse.duration && (
                        <div className="flex items-center">
                          <FiClock className="mr-1" />
                          <span>{formatDuration(miniCourse.duration)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <FiEye className="mr-1" />
                        <span>{formatViews(miniCourse.views)} shlédnutí</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-neutral-500">
                        Zakoupeno za {miniCourse.price} Kč
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(miniCourse.purchaseDate).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    
                    <Link 
                      href={`/blog/${miniCourse.slug}`} 
                      prefetch={false}
                      className="btn-primary inline-flex items-center justify-center w-full"
                    >
                      Sledovat video <FiPlay className="ml-2" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 p-8 rounded-lg text-center">
              <h3 className="text-xl font-medium mb-2">Zatím nemáte žádné minikurzy</h3>
              <p className="text-neutral-600 mb-4">
                Prozkoumejte naši nabídku minikurzů a začněte se vzdělávat v krátkých, praktických videích.
              </p>
              <Link href="/blog" prefetch={false} className="btn-primary">
                Prozkoumat minikurzy
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Mini Courses */}
      {availableMiniCourses.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableMiniCourses.map((miniCourse: AvailableMiniCourse) => (
                <div key={miniCourse.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-neutral-100">
                    {miniCourse.thumbnailUrl ? (
                      <img 
                        src={miniCourse.thumbnailUrl} 
                        alt={miniCourse.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                        <FiPlay className="text-4xl text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-2">{miniCourse.title}</h3>
                    {miniCourse.subtitle && (
                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {miniCourse.subtitle}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                      {miniCourse.duration && (
                        <div className="flex items-center">
                          <FiClock className="mr-1" />
                          <span>{formatDuration(miniCourse.duration)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <FiEye className="mr-1" />
                        <span>{formatViews(miniCourse.views)} shlédnutí</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${!miniCourse.isPaid ? 'text-green-600' : 'text-secondary-600'}`}>
                        {!miniCourse.isPaid ? 'Zdarma' : `${miniCourse.price} Kč`}
                      </span>
                      <Link 
                        href={`/blog/${miniCourse.slug}`} 
                        prefetch={false} 
                        className="btn-primary"
                      >
                        Detail minikurzu
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
