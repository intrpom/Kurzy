import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import CourseImage from '@/components/CourseImage';
import MainLayout from '@/app/MainLayout';
import { FiArrowRight, FiClock, FiBook, FiVideo, FiCreditCard } from 'react-icons/fi';
import prisma from '@/lib/db';
// Importy pro ReactMarkdown odstraněny, protože používáme dangerouslySetInnerHTML
import CourseAccessButton from '@/components/courses/CourseAccessButton';
import CourseDetailClient from '@/components/courses/CourseDetailClient';
import CourseDescription from '@/components/courses/CourseDescription';



interface Material {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  content?: string | null;
  lessonId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  duration: number; // v minutách
  videoUrl?: string | null;
  order: number;
  completed: boolean;
  materials: Material[];
  moduleId?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  completed: boolean;
  lessons: Lesson[];
}

interface RelatedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl?: string | null;
  price: number;
  isFeatured: boolean;
  level?: string | null;
  tags: string[];
  progress?: number | null;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  imageUrl?: string | null;
  price: number;
  isFeatured: boolean;
  level?: string | null;
  tags: string[];
  progress?: number | null;
  completed: boolean;
  modules: Module[];
}

// Pomocné funkce pro výpočet celkové doby trvání kurzu v minutách
const calculateTotalDuration = (modules: Module[]): number => {
  return modules.reduce((total: number, module: Module) => {
    return total + module.lessons.reduce((sum: number, lesson: Lesson) => sum + (lesson.duration || 0), 0);
  }, 0);
};

// Pomocná funkce pro výpočet počtu lekcí
const countLessons = (modules: Module[]): number => {
  return modules.reduce((total: number, module: Module) => total + module.lessons.length, 0);
};

// Funkce pro získání dat na serveru
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await getCourseData(params.slug);
  
  if (!course) {
    return {
      title: 'Kurz nenalezen',
      description: 'Požadovaný kurz nebyl nalezen'
    };
  }
  
  return {
    title: course.title,
    description: course.description
  };
}

// Stránka se dynamicky generuje bez cache pro aktuální data
export const dynamic = 'force-dynamic';

// Funkce pro získání dat kurzu
async function getCourseData(slug: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    return course;
  } catch (error) {
    console.error('Chyba při načítání kurzu:', error);
    return null;
  }
}

// Funkce pro získání souvisejících kurzů
async function getRelatedCourses(currentCourse: Course): Promise<RelatedCourse[]> {
  try {
    const allCourses = await prisma.course.findMany({
      where: {
        id: { not: currentCourse.id },
        tags: { hasSome: currentCourse.tags }
      },
      take: 3
    });
    
    return allCourses as RelatedCourse[];
  } catch (error) {
    console.error('Chyba při načítání souvisejících kurzů:', error);
    return [];
  }
}

// Funkce pro kontrolu přístupu uživatele ke kurzu
async function checkUserAccess(courseId: string): Promise<boolean> {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return false; // Nepřihlášený uživatel nemá přístup
    }
    
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      return false; // Neplatná session
    }
    
    if (!sessionData || !sessionData.id) {
      return false; // Neplatná session data
    }
    
    const userId = sessionData.id;
    
    // Zkontrolovat přístup ke kurzu
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    });
    
    return !!userCourse; // true pokud má přístup
  } catch (error) {
    console.error('Chyba při kontrole přístupu ke kurzu:', error);
    return false;
  }
}

export default async function CourseDetail({ params }: { params: { slug: string } }) {
  const course = await getCourseData(params.slug);
  
  if (!course) {
    notFound();
  }
  
  // Server-side kontrola přístupu - pokud má uživatel přístup, přesměruj na moje-kurzy
  const hasAccess = await checkUserAccess(course.id);
  if (hasAccess) {
    console.log('✅ Server-side: Uživatel má přístup ke kurzu, přesměrovávám na /moje-kurzy');
    redirect(`/moje-kurzy/${params.slug}`);
  }
  
  const relatedCourses = await getRelatedCourses(course);
  
  // Vypočítáme celkovou dobu trvání kurzu
  const totalDuration = calculateTotalDuration(course.modules);

  // Vypočítáme celkový počet lekcí
  const totalLessons = countLessons(course.modules);

  // Obalíme obsah do klientské komponenty pro automatické přesměrování přihlášených uživatelů
  return (
    <CourseDetailClient
      courseId={course.id}
      slug={course.slug}
      price={course.price}
    >
      <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-12">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-2/3">
              <h1 className="text-4xl font-serif font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-neutral-700 mb-6">{course.subtitle || course.description}</p>
              <div className="flex flex-wrap gap-4 mb-6">
                {course.level && (
                  <div className="flex items-center text-sm bg-white rounded-full px-4 py-1 shadow-sm">
                    <FiBook className="mr-2 text-primary-600" />
                    <span>
                      {course.level === 'beginner' ? 'Začátečník' : 
                       course.level === 'intermediate' ? 'Mírně pokročilý' : 'Pokročilý'}
                    </span>
                  </div>
                )}
                <div className="flex items-center text-sm bg-white rounded-full px-4 py-1 shadow-sm">
                  <FiClock className="mr-2 text-primary-600" />
                  <span>
                    {totalDuration} minut
                  </span>
                </div>
                <div className="flex items-center text-sm bg-white rounded-full px-4 py-1 shadow-sm">
                  <FiVideo className="mr-2 text-primary-600" />
                  <span>{totalLessons} lekcí</span>
                </div>
              </div>
              <div className="mb-4">
                {course.price === 0 ? (
                  <Link 
                    href={`/auth/login?courseId=${course.id}&slug=${course.slug}`}
                    className="btn-primary inline-flex items-center"
                  >
                    Získat kurz (je zdarma) <FiArrowRight className="ml-2" />
                  </Link>
                ) : (
                  <Link 
                    href={`/auth/login?courseId=${course.id}&slug=${course.slug}&price=${course.price}&action=purchase`}
                    className="btn-primary inline-flex items-center"
                  >
                    <FiCreditCard className="mr-2" />
                    Koupit za {course.price} Kč <FiArrowRight className="ml-2" />
                  </Link>
                )}
              </div>
              
              {/* Course Description - přesunuto výše */}
              <div className="mt-4">
                <CourseDescription description={course.description} />
              </div>
            </div>
            <div className="md:w-1/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {course.imageUrl ? (
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <CourseImage 
                      src={course.imageUrl} 
                      alt={course.title}
                      width={800}
                      height={450}
                      className="rounded-lg shadow-sm"
                      objectFit="contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
                    <span className="text-neutral-400">Obrázek není k dispozici</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-medium text-lg mb-4">Zaměření kurzu:</h3>
                  <ul className="space-y-2">
                    {course.tags.map((tag: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="text-primary-600 mt-1 mr-2 flex-shrink-0" />
                        <span>{tag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Description - přesunuto do hero sekce */}

      {/* Course Content */}
      <section className="py-12 bg-neutral-50">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8">Obsah kurzu</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {course.modules.map((module: Module, moduleIndex: number) => (
              <div key={moduleIndex} className="mb-6">
                {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                <div 
                  key={`${moduleIndex}-${lessonIndex}`} 
                  className={`p-4 flex justify-between items-center ${moduleIndex !== 0 || lessonIndex !== 0 ? 'border-t border-neutral-200' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-primary-700 font-medium">{moduleIndex * module.lessons.length + lessonIndex + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-neutral-600">
                        {lesson.description || module.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="text-neutral-500 mr-1" />
                    <span className="text-sm text-neutral-600">{lesson.duration} min</span>
                  </div>
                </div>
              ))}
              </div>
            ))}
            {totalLessons > 4 && (
              <div className="p-4 text-center border-t border-neutral-200">
                <p className="text-neutral-700">
                  A dalších {totalLessons - 4} lekcí...
                </p>
              </div>
            )}
          </div>
          <div className="mt-8 text-center">
            {course.price === 0 ? (
              <Link 
                href={`/auth/login?courseId=${course.id}&slug=${course.slug}`}
                className="btn-primary inline-flex items-center"
              >
                Získat kurz (je zdarma) <FiArrowRight className="ml-2" />
              </Link>
            ) : (
              <Link 
                href={`/auth/login?courseId=${course.id}&slug=${course.slug}&price=${course.price}&action=purchase`}
                className="btn-primary inline-flex items-center"
              >
                <FiCreditCard className="mr-2" />
                Koupit za {course.price} Kč <FiArrowRight className="ml-2" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-serif font-bold mb-8">Související kurzy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedCourses.length > 0 ? (
              relatedCourses.map((relatedCourse: RelatedCourse) => (
                <div key={relatedCourse.id} className="card">
                  <div className="relative h-48 bg-neutral-100">
                    {relatedCourse.imageUrl && (
                      <div className="relative" style={{ width: '100%', height: '192px', overflow: 'hidden' }}>
                        <CourseImage 
                          src={relatedCourse.imageUrl} 
                          alt={relatedCourse.title}
                          width={300}
                          height={169}
                          className="rounded-t-lg"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-secondary-500 text-white text-sm font-medium px-2 py-1 rounded">
                      {relatedCourse.price === 0 ? 'Zdarma' : `${relatedCourse.price} Kč`}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-2">{relatedCourse.title}</h3>
                    <p className="text-neutral-700 mb-4">
                      {relatedCourse.description}
                    </p>
                    <Link 
                      href={`/kurzy/${relatedCourse.slug}`} 
                      className="btn-outline inline-flex items-center"
                    >
                      Zobrazit detail <FiArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-neutral-600">Žádné související kurzy nebyly nalezeny</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
    </CourseDetailClient>
  );
}

// Přidání chybějící ikony
function FiCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}