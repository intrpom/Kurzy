import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import BunnyVideoPlayer from '@/components/BunnyVideoPlayer';
import ReactMarkdown from 'react-markdown';
import { FiDownload, FiHeadphones, FiLink, FiFile, FiArrowLeft, FiArrowRight, FiClock, FiExternalLink } from 'react-icons/fi';

interface Material {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  content?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  lessonId?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  videoUrl?: string | null;
  order: number;
  completed: boolean;
  materials: Material[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  completed: boolean;
  lessons: Lesson[];
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
  progress?: number;
  completed: boolean;
  videoLibraryId?: string | null;
  modules: Module[];
}

// Nastavení dynamického generování stránky, aby se vždy načítala aktuální data
// Toto zajistí, že se materiály vždy zobrazí aktuální
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Žádné cachování

// Funkce pro extrakci ID videa z URL
function extractVideoId(url: string): string {
  // Pokud je URL prázdné, vrátíme prázdný řetězec
  if (!url) return '';
  
  // Pokud URL již obsahuje pouze ID (UUID formát), vrátíme ho přímo
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)) {
    return url;
  }
  
  // Zkusíme najít ID v různých formátech URL z Bunny.net
  
  // Direct Play URL: https://iframe.mediadelivery.net/play/424657/16da5a72-631a-4e7e-9b72-a4c8920e6f42
  const directPlayMatch = url.match(/\/play\/\d+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (directPlayMatch) return directPlayMatch[1];
  
  // Embed URL: https://iframe.mediadelivery.net/embed/424657/16da5a72-631a-4e7e-9b72-a4c8920e6f42
  const embedMatch = url.match(/\/embed\/\d+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (embedMatch) return embedMatch[1];
  
  // HLS Playlist URL: https://vz-a7c54915-1b0.b-cdn.net/16da5a72-631a-4e7e-9b72-a4c8920e6f42/playlist.m3u8
  const hlsMatch = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/playlist\.m3u8/i);
  if (hlsMatch) return hlsMatch[1];
  
  // Obecný případ - hledáme UUID kdekoliv v URL
  const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  
  // Pokud se nepodařilo najít ID, vrátíme původní URL
  // V komponentě BunnyVideoPlayer bude zobrazena chybová hláška
  return url;
}

// Funkce pro získání dat kurzu a lekce
async function getCourseAndLessonData(slug: string, lessonId: string) {
  try {
    console.log(`Začínám načítat data pro kurz ${slug} a lekci ${lessonId}`);
    
    // Načtení kurzu podle slug
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: { materials: true }
            }
          }
        }
      }
    }) as unknown as Course; // Typový casting pro zajištění správné typové kompatibility
    
    console.log(`Kurz načten: ${course?.title}, počet modulů: ${course?.modules.length}`)

    if (!course) return null;

    // Najdeme lekci podle ID
    let targetLesson: Lesson | null = null;
    let moduleIndex = -1;
    let lessonIndex = -1;
    
    console.log(`Hledám lekci s ID: ${lessonId}`);

    for (let i = 0; i < course.modules.length; i++) {
      const module = course.modules[i];
      const foundLessonIndex = module.lessons.findIndex((lesson: Lesson) => lesson.id === lessonId);
      
      if (foundLessonIndex !== -1) {
        targetLesson = module.lessons[foundLessonIndex];
        moduleIndex = i;
        lessonIndex = foundLessonIndex;
        console.log(`Našel jsem lekci: ${targetLesson.title}`);
        console.log(`Počet materiálů v lekci: ${targetLesson.materials?.length || 0}`);
        if (targetLesson.materials && targetLesson.materials.length > 0) {
          targetLesson.materials.forEach((material: any, index) => {
            console.log(`Materiál ${index + 1}: ${material.title}, typ: ${material.type}, URL: ${material.url || 'není'}`);
          });
        }
        break;
      }
    }

    if (!targetLesson) return null;

    // Najdeme předchozí a následující lekci pro navigaci
    let prevLesson: { id: string; title: string } | null = null;
    let nextLesson: { id: string; title: string } | null = null;

    if (lessonIndex > 0) {
      // Předchozí lekce ve stejném modulu
      const prev = course.modules[moduleIndex].lessons[lessonIndex - 1];
      prevLesson = { id: prev.id, title: prev.title };
    } else if (moduleIndex > 0) {
      // Poslední lekce předchozího modulu
      const prevModule = course.modules[moduleIndex - 1];
      if (prevModule.lessons.length > 0) {
        const prev = prevModule.lessons[prevModule.lessons.length - 1];
        prevLesson = { id: prev.id, title: prev.title };
      }
    }

    if (lessonIndex < course.modules[moduleIndex].lessons.length - 1) {
      // Následující lekce ve stejném modulu
      const next = course.modules[moduleIndex].lessons[lessonIndex + 1];
      nextLesson = { id: next.id, title: next.title };
    } else if (moduleIndex < course.modules.length - 1) {
      // První lekce následujícího modulu
      const nextModule = course.modules[moduleIndex + 1];
      if (nextModule.lessons.length > 0) {
        const next = nextModule.lessons[0];
        nextLesson = { id: next.id, title: next.title };
      }
    }

    return {
      course,
      lesson: targetLesson,
      navigation: {
        prev: prevLesson,
        next: nextLesson
      },
      moduleTitle: course.modules[moduleIndex].title
    };
  } catch (error) {
    console.error('Chyba při načítání dat kurzu a lekce:', error);
    return null;
  }
}

// Generování metadat pro SEO
export async function generateMetadata({ params }: { params: { slug: string, lessonId: string } }) {
  const data = await getCourseAndLessonData(params.slug, params.lessonId);
  
  if (!data) {
    return {
      title: 'Lekce nenalezena',
      description: 'Požadovaná lekce nebyla nalezena.'
    };
  }

  return {
    title: `${data.lesson.title} | ${data.course.title}`,
    description: data.lesson.description || `Lekce kurzu ${data.course.title}`
  };
}

// Nastavení dynamického generování stránky je definováno výše

export default async function LessonDetail({ params }: { params: { slug: string, lessonId: string } }) {
  const data = await getCourseAndLessonData(params.slug, params.lessonId);
  
  if (!data) notFound();
  
  const { course, lesson, navigation, moduleTitle } = data;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigační lišta */}
      <div className="bg-white border-b border-neutral-200 py-4">
        <div className="container-custom">
          <div className="flex justify-between items-center">
            <Link href={`/kurzy/${course.slug}`} className="text-neutral-600 hover:text-primary-600 flex items-center">
              <FiArrowLeft className="mr-2" /> Zpět na kurz
            </Link>
            <h1 className="text-lg font-medium">{course.title}</h1>
          </div>
        </div>
      </div>
      
      {/* Obsah lekce */}
      <div className="container-custom py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Informace o lekci a popis nad videem */}
          <div className="p-6 pb-0">
            <div className="flex items-center text-sm text-neutral-500 mb-2">
              <span>{moduleTitle}</span>
              <span className="mx-2">•</span>
              <div className="flex items-center">
                <FiClock className="mr-1" />
                <span>{lesson.duration} min</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">{lesson.title}</h2>
            
            {lesson.description && (
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>{lesson.description}</ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Video přehrávač */}
          {lesson.videoUrl ? (
            <BunnyVideoPlayer 
              videoId={extractVideoId(lesson.videoUrl)} 
              title={lesson.title}
              className="mb-6"
              libraryId={course.videoLibraryId || '424657'} 
            />
          ) : (
            <div className="aspect-video bg-neutral-800 flex items-center justify-center text-white mb-6">
              <p>Pro tuto lekci není k dispozici video</p>
            </div>
          )}
          
          {/* Materiály a další obsah */}
          <div className="p-6 pt-0">
            
            {/* Materiály k lekci */}
            {lesson.materials && lesson.materials.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Materiály k lekci</h3>
                <div className="space-y-3">
                  {lesson.materials
                    .filter(material => {
                      // Zjistíme, zda je aktuální lekce první lekcí prvního modulu
                      const isFirstModule = course.modules.findIndex(m => m.lessons.some(l => l.id === lesson.id)) === 0;
                      const isFirstLesson = isFirstModule && course.modules[0].lessons.findIndex(l => l.id === lesson.id) === 0;
                      
                      // Filtrujeme materiál s názvem "Úvodní materiál" v první lekci prvního modulu
                      return !(isFirstLesson && material.title === "Úvodní materiál");
                    })
                    .map((material) => (
                    <div key={material.id} className="flex items-center p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                      {/* Ikona podle typu materiálu */}
                      {material.type === 'pdf' && <FiFile className="text-red-500 mr-3" size={20} />}
                      {material.type === 'audio' && <FiHeadphones className="text-blue-500 mr-3" size={20} />}
                      {material.type === 'link' && <FiLink className="text-green-500 mr-3" size={20} />}
                      {material.type === 'text' && <FiFile className="text-neutral-500 mr-3" size={20} />}
                      
                      <div className="flex-1">
                        <p className="font-medium">{material.title}</p>
                      </div>
                      
                      {/* Tlačítko pro stažení PDF */}
                      {material.type === 'pdf' && material.url && (
                        <a 
                          href={material.url} 
                          download
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 flex items-center"
                        >
                          <FiDownload className="mr-1" />
                          <span>Stáhnout PDF</span>
                        </a>
                      )}
                      
                      {/* Tlačítko pro ostatní typy materiálů s URL */}
                      {material.type !== 'pdf' && material.url && (
                        <a 
                          href={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <FiExternalLink className="mr-1" />
                          <span>Otevřít</span>
                        </a>
                      )}
                      {material.content && (
                        <div className="text-sm mt-2">
                          {material.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigace mezi lekcemi */}
        <div className="mt-6 flex justify-between">
          {navigation.prev ? (
            <Link 
              href={`/kurzy/${course.slug}/lekce/${navigation.prev.id}`}
              className="flex items-center text-neutral-600 hover:text-primary-600"
            >
              <FiArrowLeft className="mr-2" /> {navigation.prev.title}
            </Link>
          ) : (
            <div></div>
          )}
          
          {navigation.next ? (
            <Link 
              href={`/kurzy/${course.slug}/lekce/${navigation.next.id}`}
              className="flex items-center text-neutral-600 hover:text-primary-600"
            >
              {navigation.next.title} <FiArrowRight className="ml-2" />
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}
