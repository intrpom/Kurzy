'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Course, Module, Lesson } from '@/types/course';
import CourseBasicInfo from './CourseBasicInfo';
import ModuleManager from './ModuleManager';
import { loadCourse, saveCourse, saveCourseOptimized, createCourse } from '@/api/adminCourses';
import { FiSave, FiArrowLeft, FiPlus, FiCheck, FiX } from 'react-icons/fi';

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Toast notifikace komponenta
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? <FiCheck /> : type === 'error' ? <FiX /> : <FiPlus />;

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 transform translate-x-0`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <FiX />
      </button>
    </div>
  );
};

interface CourseManagerProps {
  courseId: string;
}

/**
 * Komponenta pro správu kurzu v administraci
 */
export default function CourseManager({ courseId }: CourseManagerProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sledování změněných lekcí
  const [changedLessonIds, setChangedLessonIds] = useState<string[]>([]);
  
  // Toast notifikace
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Progress tracking pro ukládání
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  
  // Reference na původní načtený kurz pro porovnání změn
  const originalCourseRef = useRef<Course | null>(null);
  
  // Debounce timer pro automatické ukládání při změnách (debounce)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce timer pro změny v lekcích
  const lessonChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Retry mechanism pro ukládání
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // Offline detection
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Debounce pro změny v lekcích - zabrání příliš častému spouštění auto-save
  const debouncedLessonChange = useCallback(
    debounce((moduleId: string, lessonId: string, field: string, value: any) => {
      handleLessonChange(moduleId, lessonId, field, value);
    }, 300),
    []
  );
  
  // Automatické ukládání je vypnuté - uživatel ukládá manuálně
  // useEffect(() => {
  //   if (autoSaveTimerRef.current) {
  //     clearTimeout(autoSaveTimerRef.current);
  //   }
  //   
  //   if (hasChanges && isOnline) {
  //     autoSaveTimerRef.current = setTimeout(() => {
  //       console.log('Automatické ukládání po 5 sekundách neaktivity...');
  //       handleSave();
  //     }, 5000);
  //   }
  //   
  //   return () => {
  //     if (autoSaveTimerRef.current) {
  //       clearTimeout(autoSaveTimerRef.current);
  //   };
  // }, [hasChanges, isOnline]);
  
  // Keyboard shortcuts pro rychlejší práci
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S nebo Cmd+S pro uložení
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isSaving) {
          console.log('Keyboard shortcut: Ctrl+S - ukládám kurz');
          handleSave();
        }
      }
      
      // Escape pro zrušení
      if (e.key === 'Escape') {
        if (hasChanges && !isSaving) {
          console.log('Keyboard shortcut: Escape - zrušuji změny');
          handleCancel();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasChanges, isSaving]);
  
  // Efekt pro automatické načtení kurzu při změně ID
  useEffect(() => {
    async function fetchCourse() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Pokud je courseId "new", vytvoříme nový kurz
        if (courseId === 'new') {
          setIsNewCourse(true);
          const newCourse: Course = {
            id: uuidv4(),
            title: 'Nový kurz',
            slug: `novy-kurz-${Date.now()}`,
            description: '',
            subtitle: '',
            imageUrl: '',
            price: 0,
            isFeatured: false,
            level: 'beginner',
            tags: [],
            modules: []
          };
          setCourse(newCourse);
          setExpandedModules({});
        } else {
          // Jinak načteme existující kurz
          const courseData = await loadCourse(courseId);
          console.log('CourseManager: Načtený kurz:', courseData);
          console.log('CourseManager: Počet modulů:', courseData.modules?.length || 0);
          
          // Zajistíme, že moduly a lekce jsou správně inicializovány
          if (!courseData.modules) courseData.modules = [];
          
          // Kontrola a logování modulů
          if (courseData.modules && courseData.modules.length > 0) {
            console.log('CourseManager: První modul:', courseData.modules[0].title);
            
            // Zajistíme, že každý modul má inicializované pole lekcí
            courseData.modules = courseData.modules.map(module => {
              if (!module.lessons) module.lessons = [];
              console.log(`Modul ${module.title} má ${module.lessons.length} lekcí`);
              
              // Zajistíme, že každá lekce má inicializované pole materiálů
              if (module.lessons && module.lessons.length > 0) {
                module.lessons = module.lessons.map(lesson => {
                  if (!lesson.materials) lesson.materials = [];
                  return lesson;
                });
              }
              
              return module;
            });
          } else {
            console.log('CourseManager: Kurz nemá žádné moduly!');
          }
          
          setCourse(courseData);
          
          // Uložíme si původní stav kurzu pro porovnání změn
          originalCourseRef.current = JSON.parse(JSON.stringify(courseData));
          setHasChanges(false);
          
          // Nastavíme všechny moduly jako rozbalené
          const expanded: Record<string, boolean> = {};
          courseData.modules.forEach(module => {
            expanded[module.id] = true;
          });
          setExpandedModules(expanded);
        }
      } catch (error: any) {
        console.error('Chyba při načítání kurzu:', error);
        setError(error.message || 'Nepodařilo se načíst kurz');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCourse();
  }, [courseId]);
  
  // Obsluha změny základních údajů kurzu s optimalizovanou detekcí změn
  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!course) return;
    
    const { name, value } = e.target;
    
    // Porovnání s původní hodnotou pro optimalizaci
    if (originalCourseRef.current && originalCourseRef.current[name as keyof Course] === value) {
      console.log(`Kurz: pole ${name} se nezměnilo, přeskakuji`);
      return;
    }
    
    console.log(`Kurz: změna pole ${name} z "${originalCourseRef.current?.[name as keyof Course]}" na "${value}"`);
    
    setCourse({
      ...course,
      [name]: value
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Obsluha změny zaškrtávacích políček s optimalizovanou detekcí změn
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!course) return;
    
    const { name, checked } = e.target;
    
    // Porovnání s původní hodnotou pro optimalizaci
    if (originalCourseRef.current && originalCourseRef.current[name as keyof Course] === checked) {
      console.log(`Kurz: checkbox ${name} se nezměnil, přeskakuji`);
      return;
    }
    
    console.log(`Kurz: změna checkboxu ${name} z "${originalCourseRef.current?.[name as keyof Course]}" na "${checked}"`);
    
    setCourse({
      ...course,
      [name]: checked
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Obsluha změny tagů
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!course) return;
    
    const tagsString = e.target.value;
    
    // Rozdělení podle čárek a ošetření prázdných stringů
    const tagsArray = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Aktualizace kurzu s novými tagy
    setCourse({
      ...course,
      tags: tagsArray
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Obsluha nahrání obrázku s optimalizovanou detekcí změn
  const handleImageUpload = (url: string) => {
    if (!course) return;
    
    // Porovnání s původní URL pro optimalizaci
    if (originalCourseRef.current && originalCourseRef.current.imageUrl === url) {
      console.log('Kurz: imageUrl se nezměnil, přeskakuji');
      return;
    }
    
    console.log(`Kurz: změna imageUrl z "${originalCourseRef.current?.imageUrl}" na "${url}"`);
    
    setCourse({
      ...course,
      imageUrl: url
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Přepínání rozbalení modulu
  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Obsluha změny modulu s optimalizovanou detekcí změn
  const handleModuleChange = (moduleId: string, field: string, value: any) => {
    if (!course) return;
    
    // Najdeme původní modul pro porovnání změn
    const originalModule = originalCourseRef.current?.modules?.find(m => m.id === moduleId);
    
    // Pokud se hodnota nezměnila, nic neděláme
    if (originalModule && originalModule[field as keyof Module] === value) {
      console.log(`Modul ${moduleId}: pole ${field} se nezměnilo, přeskakuji`);
      return;
    }
    
    // Logování změn pro lepší debugging
    if (field === 'videoLibraryId') {
      console.log(`Změna videoLibraryId u modulu ${moduleId}:`, {
        původní: originalModule ? originalModule.videoLibraryId : 'neznámá',
        nová: value
      });
    }
    
    // Aktualizujeme modul v kurzu
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          return { ...module, [field]: value };
        }
        return module;
      })
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Aktualizace lekce v modulu s optimalizovanou detekcí změn
  const handleUpdateLesson = (moduleId: string, lessonId: string, updatedLesson: Lesson) => {
    if (!course) return;
    
    // Porovnání s původní lekcí pro optimalizaci
    const originalLesson = originalCourseRef.current?.modules
      ?.find(m => m.id === moduleId)?.lessons
      ?.find(l => l.id === lessonId);
    
    if (originalLesson && JSON.stringify(originalLesson) === JSON.stringify(updatedLesson)) {
      console.log(`Lekce ${lessonId}: žádné změny, přeskakuji`);
      return;
    }
    
    console.log(`Lekce ${lessonId}: aktualizace z "${originalLesson?.title}" na "${updatedLesson.title}"`);
    
    const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    const module = course.modules[moduleIndex];
    
    const updatedLessons = module.lessons.map(l => 
      l.id === lessonId ? updatedLesson : l
    );
    
    const updatedModule = {
      ...module,
      lessons: updatedLessons
    };
    
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = updatedModule;
    
    setCourse({
      ...course,
      modules: updatedModules
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
    
    // Přidáme ID lekce do seznamu změněných lekcí, pokud tam ještě není
    if (!changedLessonIds.includes(lessonId)) {
      setChangedLessonIds(prev => [...prev, lessonId]);
    }
  };
  
  // Obsluha změn v lekcích s optimalizovanou detekcí změn
  const handleLessonChange = (moduleId: string, lessonId: string, field: string, value: any) => {
    if (!course) return;
    
    // Kontrola, zda se hodnota skutečně změnila
    const module = course.modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    // Porovnání s původní hodnotou pro optimalizaci
    const originalLesson = originalCourseRef.current?.modules
      ?.find(m => m.id === moduleId)?.lessons
      ?.find(l => l.id === lessonId);
    
    // Pokud se hodnota nezměnila, nic neděláme
    if (originalLesson && originalLesson[field as keyof Lesson] === value) {
      console.log(`Lekce ${lessonId}: pole ${field} se nezměnilo, přeskakuji`);
      return;
    }
    
    console.log(`Lekce ${lessonId}: změna pole ${field} z "${originalLesson?.[field as keyof Lesson]}" na "${value}"`);
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            lessons: module.lessons.map(lesson => {
              if (lesson.id === lessonId) {
                // Zpracování materiálů - může být pole nebo JSON string
                if (field === 'materials') {
                  // Pokud je value již pole, použijeme ho přímo
                  if (Array.isArray(value)) {
                    console.log('Materiály jsou již pole, používám přímo:', value);
                    return { ...lesson, materials: value };
                  }
                  // Pokud je value string, pokusíme se ho parsovat jako JSON
                  else if (typeof value === 'string') {
                    try {
                      console.log('Parsování materiálů z JSON stringu');
                      const materials = JSON.parse(value);
                      return { ...lesson, materials };
                    } catch (error) {
                      console.error('Chyba při parsování materiálů:', error);
                      return lesson;
                    }
                  }
                  // Pokud value není ani pole ani string, vrátíme původní lekci
                  console.error('Neplatný formát materiálů:', value);
                  return lesson;
                }
                // Ostatní pole zpracujeme normálně
                return { ...lesson, [field]: value };
              }
              return lesson;
            })
          };
        }
        return module;
      })
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
    
    // Přidáme ID lekce do seznamu změněných lekcí, pokud tam ještě není
    if (!changedLessonIds.includes(lessonId)) {
      setChangedLessonIds(prev => [...prev, lessonId]);
      console.log(`Lekce ${lessonId} přidána do seznamu změněných lekcí. Aktuální seznam:`, [...changedLessonIds, lessonId]);
    }
  };
  
  // Generování slugu z názvu kurzu s optimalizovanou detekcí změn
  const generateSlug = () => {
    if (!course || !course.title) return;
    
    const slug = course.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Odstranění diakritiky
      .replace(/[^\w\s-]/g, '') // Odstranění speciálních znaků
      .replace(/\s+/g, '-') // Nahrazení mezer pomlčkami
      .replace(/-+/g, '-'); // Odstranění vícenásobných pomlček
    
    // Porovnání s původním slugem pro optimalizaci
    if (originalCourseRef.current && originalCourseRef.current.slug === slug) {
      console.log('Kurz: slug se nezměnil, přeskakuji');
      return;
    }
    
    console.log(`Kurz: změna slugu z "${originalCourseRef.current?.slug}" na "${slug}"`);
    
    setCourse({
      ...course,
      slug
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Přidání nového modulu s optimalizovaným logováním
  const addModule = () => {
    if (!course) return;
    
    // Určit pořadí nového modulu - bude poslední v seznamu
    const maxOrder = course.modules.length > 0
      ? Math.max(...course.modules.map(module => module.order || 0))
      : 0;
    const newOrder = maxOrder + 1;
    
    const newModule: Module = {
      id: uuidv4(),
      title: 'Nový modul',
      description: '',
      lessons: [],
      order: newOrder // Přidáno pořadí
    };
    
    console.log(`Přidávám nový modul: ${newModule.title} (ID: ${newModule.id})`);
    
    setCourse({
      ...course,
      modules: [...course.modules, newModule]
    });
    
    // Automaticky rozbalíme nový modul
    setExpandedModules(prev => ({
      ...prev,
      [newModule.id]: true
    }));
    
    // Nastavíme příznak změn
    setHasChanges(true);
    
    // Při přidání nového modulu nemusíme nic dělat, protože sledujeme pouze lekce
  };
  
  // Smazání modulu s optimalizovaným logováním
  const deleteModule = async (moduleId: string) => {
    if (!course) return;
    
    if (window.confirm('Opravdu chcete smazat tento modul? Tato akce je nevratná.')) {
      // Najdeme modul, který se má smazat, abychom mohli odstranit jeho lekce ze seznamu změněných lekcí
      const moduleToDelete = course.modules.find(m => m.id === moduleId);
      
      if (moduleToDelete) {
        console.log(`Mažu modul: ${moduleToDelete.title} (ID: ${moduleId}) s ${moduleToDelete.lessons.length} lekcemi`);
      }
      
      setCourse({
        ...course,
        modules: course.modules.filter(module => module.id !== moduleId)
      });
      
      // Nastavíme příznak změn
      setHasChanges(true);
      
      // Odstraníme ID všech lekcí z modulu ze seznamu změněných lekcí
      if (moduleToDelete) {
        const lessonIdsToRemove = moduleToDelete.lessons.map(lesson => lesson.id);
        setChangedLessonIds(prev => prev.filter(id => !lessonIdsToRemove.includes(id)));
        console.log(`Odstranil jsem ${lessonIdsToRemove.length} lekcí ze seznamu změněných lekcí`);
      }
    }
  };
  
  // Přidání nové lekce do modulu s optimalizovaným logováním
  const addLesson = (moduleId: string) => {
    if (!course) return;
    
    const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;
    
    const module = course.modules[moduleIndex];
    
    const newLesson: Lesson = {
      id: uuidv4(),
      title: 'Nová lekce',
      description: '',
      duration: 0,
      videoUrl: '',
      order: module.lessons.length,
      completed: false,
      materials: []
    };
    
    console.log(`Přidávám novou lekci: ${newLesson.title} (ID: ${newLesson.id}) do modulu: ${module.title}`);
    
    const updatedModule = {
      ...module,
      lessons: [...module.lessons, newLesson]
    };
    
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = updatedModule;
    
    setCourse({
      ...course,
      modules: updatedModules
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
    
    // Přidáme ID nové lekce do seznamu změněných lekcí
    setChangedLessonIds(prev => [...prev, newLesson.id]);
  };
  
  // Smazání lekce z modulu s optimalizovaným logováním
  const deleteLesson = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    if (window.confirm('Opravdu chcete smazat tuto lekci? Tato akce je nevratná.')) {
      // Najdeme lekci, kterou se má smazat, pro lepší logování
      const module = course.modules.find(m => m.id === moduleId);
      const lessonToDelete = module?.lessons.find(l => l.id === lessonId);
      
      if (lessonToDelete) {
        console.log(`Mažu lekci: ${lessonToDelete.title} (ID: ${lessonId}) z modulu: ${module?.title}`);
      }
      
      setCourse({
        ...course,
        modules: course.modules.map(module => {
          if (module.id === moduleId) {
            return {
              ...module,
              lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
            };
          }
          return module;
        })
      });
      
      // Nastavíme příznak změn
      setHasChanges(true);
      
      // Odstraníme ID lekce ze seznamu změněných lekcí, pokud tam je
      setChangedLessonIds(prev => prev.filter(id => id !== lessonId));
    }
  };

  // Posun lekce nahoru s optimalizovaným logováním
  const moveLessonUp = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          const lessons = [...module.lessons];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex > 0) {
            const lesson = lessons[lessonIndex];
            const previousLesson = lessons[lessonIndex - 1];
            
            console.log(`Posouvám lekci "${lesson.title}" nahoru nad "${previousLesson.title}" v modulu "${module.title}"`);
            
            // Prohození s předchozí lekcí
            [lessons[lessonIndex], lessons[lessonIndex - 1]] = [lessons[lessonIndex - 1], lessons[lessonIndex]];
            
            // Aktualizace order hodnot
            lessons.forEach((lesson, index) => {
              lesson.order = index;
            });
          } else {
            console.log(`Lekce "${lessons[lessonIndex]?.title}" je již na vrcholu, nelze posunout nahoru`);
          }
          
          return { ...module, lessons };
        }
        return module;
      })
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };

  // Posun lekce dolů s optimalizovaným logováním
  const moveLessonDown = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          const lessons = [...module.lessons];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex < lessons.length - 1) {
            const lesson = lessons[lessonIndex];
            const nextLesson = lessons[lessonIndex + 1];
            
            console.log(`Posouvám lekci "${lesson.title}" dolů pod "${nextLesson.title}" v modulu "${module.title}"`);
            
            // Prohození s následující lekcí
            [lessons[lessonIndex], lessons[lessonIndex + 1]] = [lessons[lessonIndex + 1], lessons[lessonIndex]];
            
            // Aktualizace order hodnot
            lessons.forEach((lesson, index) => {
              lesson.order = index;
            });
          } else {
            console.log(`Lekce "${lessons[lessonIndex]?.title}" je již na spodku, nelze posunout dolů`);
          }
          
          return { ...module, lessons };
        }
        return module;
      })
    });
    
    // Nastavíme příznak změn
    setHasChanges(true);
  };
  
  // Uložení kurzu s optimalizovaným přístupem
  const handleSave = async () => {
    if (!course || isSaving) return;
    
    // Zrušíme auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    const startTime = performance.now();
    setIsSaving(true);
    setError(null);
    setSaveProgress({ current: 0, total: 1, message: 'Připravuji ukládání...' });
    
    try {
      // Pokud je to nový kurz, vytvoříme ho
      if (isNewCourse) {
        setSaveProgress({ current: 1, total: 1, message: 'Vytvářím nový kurz...' });
        const newCourse = await createCourse(course);
        
        const endTime = performance.now();
        console.log(`Kurz vytvořen za ${(endTime - startTime).toFixed(2)}ms`);
        
        setToast({ message: 'Kurz byl úspěšně vytvořen!', type: 'success' });
        setTimeout(() => router.push(`/admin/kurzy/${newCourse.id}`), 1500);
      } else {
        // Aktualizace existujícího kurzu - použijeme optimalizovanou verzi
        console.log(`Ukládám kurz s ${changedLessonIds.length} změněnými lekcemi`);
        
        setSaveProgress({ current: 1, total: 2, message: 'Ukládám základní údaje kurzu...' });
        const courseStartTime = performance.now();
        const savedCourse = await saveCourseOptimized(course, originalCourseRef.current, changedLessonIds);
        const courseEndTime = performance.now();
        
        if (changedLessonIds.length > 0) {
          setSaveProgress({ current: 2, total: 2, message: `Ukládám ${changedLessonIds.length} změněných lekcí...` });
        }
        
        setCourse(savedCourse);
        
        // Aktualizujeme referenci na původní kurz
        originalCourseRef.current = JSON.parse(JSON.stringify(savedCourse));
        setHasChanges(false);
        
        // Resetujeme seznam změněných lekcí
        setChangedLessonIds([]);
        
        // Resetujeme retry count při úspěšném ukládání
        setRetryCount(0);
        
        const endTime = performance.now();
        console.log(`Kurz uložen za ${(endTime - startTime).toFixed(2)}ms (kurz: ${(courseEndTime - courseStartTime).toFixed(2)}ms, lekce: ${(endTime - courseEndTime).toFixed(2)}ms)`);
        
        setToast({ message: 'Kurz byl úspěšně uložen!', type: 'success' });
      }
    } catch (error: any) {
      console.error('Chyba při ukládání kurzu:', error);
      setError(error.message || 'Nepodařilo se uložit kurz');
      setToast({ message: `Chyba: ${error.message || 'Nepodařilo se uložit kurz'}`, type: 'error' });
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  };

  // Zrušení úprav a návrat na seznam kurzů
  const handleCancel = () => {
    if (isSaving) return;
    
    // Pokud nebyly provedeny žádné změny, není třeba potvrzovat
    if (!hasChanges) {
      router.push('/admin/kurzy');
      return;
    }
    
    if (window.confirm('Opravdu chcete zrušit úpravy? Neuložené změny budou ztraceny.')) {
      router.push('/admin/kurzy');
    }
  };
  
  // Retry funkce pro ukládání
  const retrySave = async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setToast({ message: `Opakuji ukládání... (${retryCount + 1}/${maxRetries})`, type: 'info' });
      
      // Krátká pauza před retry
      setTimeout(() => {
        handleSave();
      }, 1000);
    } else {
      setToast({ message: 'Maximální počet pokusů vyčerpán. Zkuste to později.', type: 'error' });
      setRetryCount(0);
    }
  };
  
  // Zobrazení načítání
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
          <p>Načítání kurzu...</p>
        </div>
      </div>
    );
  }
  
  // Zobrazení chyby
  if (error || !course) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error || 'Kurz nebyl nalezen'}</p>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => router.push('/admin/kurzy')}
              className="px-4 py-2 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
            >
              Zpět na seznam kurzů
            </button>
            {error && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Zkusit znovu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Toast notifikace */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Offline warning */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between text-sm text-red-700">
            <span className="flex items-center">
              <FiX className="w-4 h-4 mr-2" />
              Jste offline - změny se neuloží
            </span>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Obnovit
            </button>
          </div>
        </div>
      )}
      
      {/* Retry button pro neúspěšné ukládání */}
      {retryCount > 0 && retryCount < maxRetries && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between text-sm text-yellow-700">
            <span>Ukládání se nezdařilo. Zkuste to znovu.</span>
            <button
              onClick={retrySave}
              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            >
              Opakovat ({retryCount}/{maxRetries})
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium">
          {isNewCourse ? 'Nový kurz' : `Úprava kurzu: ${course.title}`}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Ukládám...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>Uložit kurz</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Keyboard shortcuts info */}
      <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>Klávesové zkratky:</span>
          <div className="flex items-center space-x-4">
            <span><kbd className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs">Ctrl+S</kbd> Uložit</span>
            <span><kbd className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs">Esc</kbd> Zrušit</span>
          </div>
        </div>
      </div>
      
      {/* Progress bar pro ukládání */}
      {isSaving && (
        <div className="mb-6">
          <div className="bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: saveProgress ? `${(saveProgress.current / saveProgress.total) * 100}%` : '100%' 
              }}
            ></div>
          </div>
          <p className="text-sm text-neutral-600 mt-2 text-center">
            {saveProgress ? saveProgress.message : 'Ukládám změny... Prosím vyčkejte.'}
          </p>
          {saveProgress && (
            <p className="text-xs text-neutral-500 mt-1 text-center">
              Krok {saveProgress.current} z {saveProgress.total}
            </p>
          )}
        </div>
      )}
      
      {/* Informace o změnách - automatické ukládání je vypnuté */}
      {hasChanges && !isSaving && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiCheck className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Neuložené změny: {changedLessonIds.length} lekce{changedLessonIds.length !== 1 ? 'í' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-blue-600">
                Uložte změny manuálně
              </span>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Uložit nyní
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Základní informace o kurzu */}
      <CourseBasicInfo
        course={course}
        onCourseChange={handleCourseChange}
        onCheckboxChange={handleCheckboxChange}
        onTagsChange={handleTagsChange}
        onImageUpload={handleImageUpload}
        onGenerateSlug={generateSlug}
        isNewCourse={isNewCourse}
      />
      
      {/* Správa modulů a lekcí */}
      <ModuleManager
        course={course}
        setCourse={setCourse}
        expandedModules={expandedModules}
        onAddModule={addModule}
        onDeleteModule={deleteModule}
        onAddLesson={addLesson}
        onDeleteLesson={deleteLesson}
        onToggleModuleExpand={(moduleId) => {
          setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
          }));
        }}
        onLessonChange={handleLessonChange}
        onModuleChange={handleModuleChange}
        onMoveLessonUp={moveLessonUp}
        onMoveLessonDown={moveLessonDown}
      />
    </div>
  );
}
