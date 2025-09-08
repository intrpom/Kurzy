import Image from 'next/image';
import CourseImage from '@/components/CourseImage';
import Link from 'next/link';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import prisma from '@/lib/db';
import MainLayout from '@/app/MainLayout';
import { cookies } from 'next/headers';
import CourseCard from '@/app/kurzy/CourseCard';

// Definice rozhraní pro kurz
interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  price: number;
  subtitle?: string | null;
  isFeatured?: boolean;
  tags?: string[];
  level?: string | null;
}

// Nastavení revalidace pro domovskou stránku na 24 hodin
// Pro kurzy, které se nemění často, je toto optimální nastavení

// Funkce pro načtení doporučených kurzů z databáze
async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isFeatured: true
      },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        description: true,
        imageUrl: true,
        price: true,
        isFeatured: true,
        level: true,
        tags: true
      },
      take: 3 // Omezení na 3 kurzy
    });
    return courses as FeaturedCourse[];
  } catch (error) {
    console.error('Chyba při načítání doporučených kurzů:', error);
    return [];
  }
}

// Funkce pro získání přístupu uživatele ke kurzům přímo z databáze
async function getUserCourseAccess(): Promise<Record<string, boolean>> {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      return {};
    }

    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      
      // Kontrola expirace
      if (sessionData.exp < Math.floor(Date.now() / 1000)) {
        return {};
      }
    } catch (sessionError) {
      return {};
    }

    // Načíst všechny UserCourse záznamy pro tohoto uživatele
    const userCourses = await prisma.userCourse.findMany({
      where: {
        userId: sessionData.userId || sessionData.id,
      },
      select: {
        courseId: true,
      },
    });

    // Vytvořit mapu courseId -> hasAccess
    const courseAccess: Record<string, boolean> = {};
    userCourses.forEach(uc => {
      courseAccess[uc.courseId] = true;
    });

    return courseAccess;
  } catch (error) {
    console.error('Chyba při načítání přístupu ke kurzům:', error);
    return {};
  }
}

export default async function Home() {
  // Načtení doporučených kurzů a přístupu uživatele paralelně
  const [featuredCourses, userCourseAccess] = await Promise.all([
    getFeaturedCourses(),
    getUserCourseAccess()
  ]);
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16 md:py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
                Objevte své skryté možnosti s online kurzy
              </h1>
              <p className="text-lg text-neutral-700 mb-8">
                Vítejte ve světě kurzů, které vám pomohou rozvíjet vaši psychiku, 
                osobnost a potenciál. Profesionální kurzy s lidským přístupem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/kurzy" prefetch={false} className="btn-primary text-center">
                  Prozkoumat kurzy
                </Link>
                <Link href="/o-mne" prefetch={false} className="btn-outline text-center">
                  Více o mně
                </Link>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              {/* Hero video */}
              <div style={{position:"relative",paddingTop:"56.25%"}}>
                <iframe 
                  src="https://iframe.mediadelivery.net/embed/271688/d33ae10f-5283-44f9-b8e2-43621c8ac526?autoplay=false&loop=false&muted=false&preload=true&responsive=true" 
                  loading="lazy" 
                  style={{border:0,position:"absolute",top:0,height:"100%",width:"100%"}} 
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" 
                  allowFullScreen={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Oblíbené kurzy</h2>
            <p className="text-neutral-700 max-w-2xl mx-auto">
              Vyberte si z nabídky kurzů, které vám pomohou v osobním rozvoji a pochopení vlastní psychiky.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.length > 0 ? (
              // Dynamické zobrazení kurzů z databáze pomocí CourseCard komponenty
              featuredCourses.map((course: FeaturedCourse, index: number) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  priority={index < 3}
                  hasAccess={userCourseAccess[course.id] || false}
                  loadingAccess={false}
                />
              ))
            ) : (
              // Záložní zobrazení, pokud nejsou žádné doporučené kurzy
              <div className="col-span-3 text-center p-8 bg-neutral-50 rounded-lg">
                <p>Momentálně nejsou k dispozici žádné doporučené kurzy.</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/kurzy" prefetch={false} className="btn-outline inline-flex items-center">
              Zobrazit všechny kurzy <FiArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Proč zvolit mé kurzy?</h2>
            <p className="text-neutral-700 max-w-2xl mx-auto">
              Kurzy jsou navrženy tak, aby vám poskytly maximální hodnotu a praktické znalosti, které můžete ihned aplikovat.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Profesionální přístup</h3>
              <p className="text-neutral-700">
                Všechny kurzy jsou založeny na odborných znalostech a mnohaletých zkušenostech.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Flexibilní studium</h3>
              <p className="text-neutral-700">
                Studujte vlastním tempem, kdykoliv a kdekoliv vám to vyhovuje.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="text-primary-600 text-xl" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">Praktické materiály</h3>
              <p className="text-neutral-700">
                Ke každé lekci získáte doplňkové materiály pro hlubší pochopení tématu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Připraveni začít svou cestu?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Prozkoumejte nabídku kurzů a vyberte si ten, který nejlépe odpovídá vašim potřebám a cílům.
          </p>
          <Link href="/kurzy" prefetch={false} className="btn bg-white text-primary-700 hover:bg-neutral-100 inline-flex items-center">
            Prozkoumat kurzy <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
