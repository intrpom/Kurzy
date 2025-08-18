export interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number; // v minutách
  videoUrl?: string;
  videoLibraryId?: string; // ID knihovny videa z Bunny.net, pokud není zadáno, použije se ID z modulu nebo kurzu
  completed?: boolean;
  order?: number; // pořadí lekce v modulu
  materials?: {
    type: 'pdf' | 'audio' | 'link' | 'text';
    title: string;
    url?: string;
    content?: string;
  }[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  completed?: boolean;
  order?: number; // pořadí modulu v kurzu
  videoLibraryId?: string; // ID knihovny videa z Bunny.net, pokud není zadáno, použije se ID z kurzu
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  price: number; // 0 pro kurzy zdarma
  isFeatured?: boolean;
  modules: Module[];
  totalLessons?: number;
  totalDuration?: number; // v minutách
  completed?: boolean;
  progress?: number; // procento dokončení (0-100)
  tags?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  videoLibraryId?: string; // ID knihovny videa z Bunny.net
  createdAt?: string;
  updatedAt?: string;
}

// Simulovaná data kurzů
export const courses: Course[] = [
  {
    id: '1',
    slug: 'sebepoznani-a-rozvoj',
    title: 'Sebepoznání a rozvoj',
    subtitle: 'Objevte svůj potenciál a cestu k osobnímu růstu',
    description: 'Tento kurz vám pomůže lépe porozumět sobě samému, svým silným stránkám a oblastem pro rozvoj. Naučíte se techniky sebepoznání, práce s emocemi a stanovování cílů pro osobní růst.',
    imageUrl: '/images/courses/sebepoznani.jpg',
    price: 990,
    isFeatured: true,
    modules: [
      {
        id: 'm1',
        title: 'Základy sebepoznání',
        description: 'Úvod do technik sebepoznání a sebereflexe',
        lessons: [
          {
            id: 'l1',
            title: 'Co je sebepoznání a proč je důležité',
            description: 'Úvodní lekce o významu sebepoznání v osobním rozvoji',
            duration: 15,
            videoUrl: '/videos/sebepoznani/uvod.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Pracovní list - Sebepoznání',
                url: '/materials/sebepoznani-pracovni-list.pdf'
              }
            ]
          },
          {
            id: 'l2',
            title: 'Techniky sebereflexe',
            description: 'Praktické techniky pro efektivní sebereflexi',
            duration: 20,
            videoUrl: '/videos/sebepoznani/techniky.mp4'
          }
        ]
      },
      {
        id: 'm2',
        title: 'Práce s emocemi',
        description: 'Jak rozpoznávat a pracovat s vlastními emocemi',
        lessons: [
          {
            id: 'l3',
            title: 'Rozpoznávání emocí',
            description: 'Jak identifikovat a pojmenovat své emoce',
            duration: 18,
            videoUrl: '/videos/sebepoznani/emoce-rozpoznavani.mp4'
          },
          {
            id: 'l4',
            title: 'Techniky pro zvládání emocí',
            description: 'Praktické techniky pro efektivní práci s emocemi',
            duration: 25,
            videoUrl: '/videos/sebepoznani/emoce-zvladani.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Deník emocí - šablona',
                url: '/materials/denik-emoci.pdf'
              },
              {
                type: 'audio',
                title: 'Meditace pro emoční rovnováhu',
                url: '/materials/meditace-emoce.mp3'
              }
            ]
          }
        ]
      }
    ],
    tags: ['sebepoznání', 'osobní rozvoj', 'emoce'],
    level: 'beginner'
  },
  {
    id: '2',
    slug: 'zvladani-stresu',
    title: 'Zvládání stresu',
    subtitle: 'Efektivní techniky pro redukci stresu a úzkosti',
    description: 'Naučte se rozpoznávat příznaky stresu a používat osvědčené techniky pro jeho zvládání. Kurz kombinuje teoretické poznatky s praktickými cvičeními pro okamžité použití v každodenním životě.',
    imageUrl: '/images/courses/stres.jpg',
    price: 0,
    modules: [
      {
        id: 'm1',
        title: 'Porozumění stresu',
        description: 'Co je stres a jak funguje v našem těle a mysli',
        lessons: [
          {
            id: 'l1',
            title: 'Fyziologie stresu',
            description: 'Jak stres působí na naše tělo a mysl',
            duration: 22,
            videoUrl: '/videos/stres/fyziologie.mp4'
          },
          {
            id: 'l2',
            title: 'Identifikace spouštěčů stresu',
            description: 'Jak rozpoznat situace a myšlenky, které spouští stresovou reakci',
            duration: 18,
            videoUrl: '/videos/stres/spoustece.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Deník stresorů',
                url: '/materials/denik-stresoru.pdf'
              }
            ]
          }
        ]
      },
      {
        id: 'm2',
        title: 'Techniky zvládání stresu',
        description: 'Praktické metody pro redukci stresu v každodenním životě',
        lessons: [
          {
            id: 'l3',
            title: 'Dechová cvičení',
            description: 'Jednoduché dechové techniky pro okamžité zklidnění',
            duration: 15,
            videoUrl: '/videos/stres/dech.mp4'
          },
          {
            id: 'l4',
            title: 'Progresivní svalová relaxace',
            description: 'Technika postupného uvolňování svalů pro hlubokou relaxaci',
            duration: 20,
            videoUrl: '/videos/stres/relaxace.mp4',
            materials: [
              {
                type: 'audio',
                title: 'Průvodce progresivní svalovou relaxací',
                url: '/materials/relaxace-audio.mp3'
              }
            ]
          }
        ]
      }
    ],
    tags: ['stres', 'relaxace', 'mindfulness'],
    level: 'beginner'
  },
  {
    id: '3',
    slug: 'komunikacni-dovednosti',
    title: 'Komunikační dovednosti',
    subtitle: 'Zlepšete své vztahy díky efektivní komunikaci',
    description: 'Tento kurz vám pomůže zlepšit vaše komunikační dovednosti, naučí vás aktivně naslouchat, jasně vyjadřovat své myšlenky a efektivně řešit konflikty.',
    imageUrl: '/images/courses/komunikace.jpg',
    price: 1290,
    isFeatured: true,
    modules: [
      {
        id: 'm1',
        title: 'Základy efektivní komunikace',
        description: 'Klíčové principy úspěšné komunikace',
        lessons: [
          {
            id: 'l1',
            title: 'Verbální a neverbální komunikace',
            description: 'Jak sladit slova s řečí těla pro jasné sdělení',
            duration: 25,
            videoUrl: '/videos/komunikace/verbalni-neverbalni.mp4'
          },
          {
            id: 'l2',
            title: 'Aktivní naslouchání',
            description: 'Techniky pro skutečné porozumění druhým',
            duration: 20,
            videoUrl: '/videos/komunikace/aktivni-naslouchani.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Cvičení aktivního naslouchání',
                url: '/materials/aktivni-naslouchani.pdf'
              }
            ]
          }
        ]
      },
      {
        id: 'm2',
        title: 'Řešení konfliktů',
        description: 'Jak efektivně řešit konflikty a nedorozumění',
        lessons: [
          {
            id: 'l3',
            title: 'Rozpoznání konfliktu',
            description: 'Jak včas identifikovat vznikající konflikt',
            duration: 18,
            videoUrl: '/videos/komunikace/rozpoznani-konfliktu.mp4'
          },
          {
            id: 'l4',
            title: 'Win-win strategie řešení konfliktů',
            description: 'Jak dosáhnout řešení výhodného pro obě strany',
            duration: 22,
            videoUrl: '/videos/komunikace/win-win.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Kroky k win-win řešení',
                url: '/materials/win-win-kroky.pdf'
              }
            ]
          }
        ]
      }
    ],
    tags: ['komunikace', 'vztahy', 'konflikty'],
    level: 'intermediate'
  },
  {
    id: '4',
    slug: 'mindfulness-v-praxi',
    title: 'Mindfulness v praxi',
    subtitle: 'Každodenní všímavost pro klidnější a spokojenější život',
    description: 'Praktický kurz mindfulness, který vám pomůže implementovat techniky všímavosti do vašeho každodenního života. Naučíte se být více přítomní, snížit stres a zlepšit svou celkovou pohodu.',
    imageUrl: '/images/courses/mindfulness.jpg',
    price: 890,
    modules: [
      {
        id: 'm1',
        title: 'Základy mindfulness',
        description: 'Úvod do praxe všímavosti a její vědecké základy',
        lessons: [
          {
            id: 'l1',
            title: 'Co je mindfulness',
            description: 'Definice, historie a vědecké pozadí mindfulness',
            duration: 15,
            videoUrl: '/videos/mindfulness/uvod.mp4'
          },
          {
            id: 'l2',
            title: 'Všímavé dýchání',
            description: 'Základní technika mindfulness zaměřená na dech',
            duration: 18,
            videoUrl: '/videos/mindfulness/dychani.mp4',
            materials: [
              {
                type: 'audio',
                title: 'Průvodce všímavým dýcháním',
                url: '/materials/vsimave-dychani.mp3'
              }
            ]
          }
        ]
      },
      {
        id: 'm2',
        title: 'Mindfulness v každodenním životě',
        description: 'Jak praktikovat všímavost během běžných činností',
        lessons: [
          {
            id: 'l3',
            title: 'Všímavé jedení',
            description: 'Jak proměnit běžné jídlo v meditativní zážitek',
            duration: 20,
            videoUrl: '/videos/mindfulness/jedeni.mp4'
          },
          {
            id: 'l4',
            title: 'Všímavá chůze',
            description: 'Technika všímavé chůze pro každodenní praxi',
            duration: 15,
            videoUrl: '/videos/mindfulness/chuze.mp4',
            materials: [
              {
                type: 'pdf',
                title: 'Průvodce všímavými aktivitami',
                url: '/materials/vsimave-aktivity.pdf'
              }
            ]
          }
        ]
      }
    ],
    tags: ['mindfulness', 'meditace', 'všímavost'],
    level: 'beginner'
  }
];

// Pomocné funkce pro práci s kurzy
export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find(course => course.slug === slug);
}

export function getFeaturedCourses(): Course[] {
  return courses.filter(course => course.isFeatured);
}

export function getFreeCourses(): Course[] {
  return courses.filter(course => course.price === 0);
}

export function getPaidCourses(): Course[] {
  return courses.filter(course => course.price > 0);
}

// Výpočet celkového počtu lekcí a délky kurzu
export function calculateCourseStats(course: Course): Course {
  let totalLessons = 0;
  let totalDuration = 0;
  
  course.modules.forEach(module => {
    totalLessons += module.lessons.length;
    module.lessons.forEach(lesson => {
      totalDuration += lesson.duration;
    });
  });
  
  return {
    ...course,
    totalLessons,
    totalDuration
  };
}
