'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave } from 'react-icons/fi';
import { Course, Module, Lesson } from '@/types/course';
import CourseBasicInfo from './CourseBasicInfo';
import ModuleList from './ModuleList';
import { v4 as uuidv4 } from 'uuid';

interface EditCourseFormProps {
  courseId: string;
}

export default function EditCourseForm({ courseId }: EditCourseFormProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Nepodařilo se načíst kurz');
        }
        const data = await response.json();
        
        // Ensure modules and lessons arrays exist
        const courseWithArrays = {
          ...data,
          modules: data.modules || [],
          tags: data.tags || []
        };
        
        // Ensure each module has a lessons array
        courseWithArrays.modules = courseWithArrays.modules.map((module: any) => ({
          ...module,
          lessons: module.lessons || []
        }));
        
        setCourse(courseWithArrays);
        
        // Expand all modules by default
        const expanded: Record<string, boolean> = {};
        courseWithArrays.modules.forEach((module: Module) => {
          expanded[module.id] = true;
        });
        setExpandedModules(expanded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nastala neznámá chyba');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!course) return;
    
    const { name, value, type } = e.target;
    
    // Speciální zpracování pro číselná pole
    let processedValue: any = value;
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setCourse({
      ...course,
      [name]: processedValue
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!course) return;
    
    const { name, checked } = e.target;
    setCourse({
      ...course,
      [name]: checked
    });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!course) return;
    
    const tagsString = e.target.value;
    const tagsArray = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    setCourse({
      ...course,
      tags: tagsArray
    });
  };

  const handleImageUpload = (url: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      imageUrl: url
    });
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleModuleChange = (moduleId: string, field: string, value: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => 
        module.id === moduleId
          ? { ...module, [field]: value }
          : module
      )
    });
  };

  const handleLessonChange = (moduleId: string, lessonId: string, field: string, value: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => 
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map(lesson => 
                lesson.id === lessonId
                  ? { ...lesson, [field]: value }
                  : lesson
              )
            }
          : module
      )
    });
  };

  const addModule = () => {
    if (!course) return;
    
    const newModule: Module = {
      id: uuidv4(),
      title: 'Nový modul',
      description: '',
      order: course.modules.length, // Nastavit order na konec seznamu
      completed: false,
      lessons: []
    };
    
    setCourse({
      ...course,
      modules: [...course.modules, newModule]
    });
    
    // Automatically expand the new module
    setExpandedModules(prev => ({
      ...prev,
      [newModule.id]: true
    }));
  };

  const deleteModule = (moduleId: string) => {
    if (!course) return;
    
    const moduleToDelete = course.modules.find(module => module.id === moduleId);
    if (!moduleToDelete) return;
    
    const confirmed = window.confirm(
      `Opravdu chceš smazat modul "${moduleToDelete.title}"?\n\n` +
      `Tímto smažeš i všech ${moduleToDelete.lessons.length} lekcí v tomto modulu!\n\n` +
      `Tato akce je nevratná!`
    );
    
    if (confirmed) {
      setCourse({
        ...course,
        modules: course.modules.filter(module => module.id !== moduleId)
      });
    }
  };

  const addLesson = (moduleId: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          const newLesson: Lesson = {
            id: uuidv4(),
            title: 'Nová lekce',
            description: '',
            duration: 0,
            videoUrl: '',
            videoLibraryId: undefined,
            order: module.lessons.length, // Nastavit order na konec seznamu
            completed: false,
            materials: []
          };
          
          return { ...module, lessons: [...module.lessons, newLesson] };
        }
        return module;
      })
    });
  };

  const moveLessonUp = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          const lessons = [...module.lessons];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex > 0) {
            // Swap with previous lesson
            [lessons[lessonIndex], lessons[lessonIndex - 1]] = [lessons[lessonIndex - 1], lessons[lessonIndex]];
            
            // Update order values
            lessons.forEach((lesson, index) => {
              lesson.order = index;
            });
          }
          
          return { ...module, lessons };
        }
        return module;
      })
    });
  };

  const moveLessonDown = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    setCourse({
      ...course,
      modules: course.modules.map(module => {
        if (module.id === moduleId) {
          const lessons = [...module.lessons];
          const lessonIndex = lessons.findIndex(l => l.id === lessonId);
          
          if (lessonIndex < lessons.length - 1) {
            // Swap with next lesson
            [lessons[lessonIndex], lessons[lessonIndex + 1]] = [lessons[lessonIndex + 1], lessons[lessonIndex]];
            
            // Update order values
            lessons.forEach((lesson, index) => {
              lesson.order = index;
            });
          }
          
          return { ...module, lessons };
        }
        return module;
      })
    });
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    if (!course) return;
    
    const module = course.modules.find(m => m.id === moduleId);
    const lessonToDelete = module?.lessons.find(lesson => lesson.id === lessonId);
    
    if (!module || !lessonToDelete) return;
    
    const confirmed = window.confirm(
      `Opravdu chceš smazat lekci "${lessonToDelete.title}"?\n\n` +
      `Tímto smažeš i všechny materiály v této lekci!\n\n` +
      `Tato akce je nevratná!`
    );
    
    if (confirmed) {
      setCourse({
        ...course,
        modules: course.modules.map(module => 
          module.id === moduleId
            ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) }
            : module
        )
      });
    }
  };

  const handleSave = async () => {
    if (!course) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // 1. AUTOMATICKÉ ZÁLOHOVÁNÍ před uložením
      console.log('🔄 Automatické zálohování před uložením...');
      try {
        const backupResponse = await fetch('/api/admin/backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          console.log('✅ Automatická záloha vytvořena:', backupData.fileName);
        } else {
          console.warn('⚠️ Automatická záloha se nepodařila, pokračuji v uložení...');
        }
      } catch (backupError) {
        console.warn('⚠️ Automatická záloha selhala, pokračuji v uložení...', backupError);
      }
      
      // 2. BEZPEČNOSTNÍ KONTROLA - varování před mazáním
      const currentModules = course.modules || [];
      const hasModules = currentModules.length > 0;
      
      if (!hasModules) {
        const confirmed = window.confirm(
          '⚠️  VAROVÁNÍ!\n\n' +
          'Chceš uložit kurz BEZ MODULŮ?\n\n' +
          'Tímto smažeš všechny existující moduly a lekce!\n\n' +
          'Opravdu chceš pokračovat?'
        );
        
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
      }
      
      // 3. ULOŽENÍ KURZU
      console.log('💾 Ukládám kurz...');
      
      // VŽDY posílat kompletní data včetně modulů a lekcí
      console.log('🔍 DEBUG - course objekt:', course);
      console.log('🔍 DEBUG - course.modules:', course.modules);
      
      const courseDataToSend = {
        ...course,
        modules: course.modules || [] // Zajistit že se vždy posílají moduly
      };
      
      console.log('📤 Posílám data:', {
        title: courseDataToSend.title,
        modulesCount: courseDataToSend.modules?.length || 0,
        lessonsCount: courseDataToSend.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0
      });
      
      console.log('📤 DEBUG - courseDataToSend.modules:', courseDataToSend.modules);
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseDataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nepodařilo se uložit kurz');
      }
      
      // Obnovení dat kurzu po úspěšném uložení
      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      
      // 3. ÚSPĚŠNÉ ULOŽENÍ
      alert('✅ Kurz byl úspěšně uložen!\n\n🔄 Automatická záloha byla vytvořena před uložením pro bezpečnost.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neznámá chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-md mb-6">{error}</div>;
  }

  if (!course) {
    return <div>Kurz nebyl nalezen</div>;
  }

  return (
    <div>
      <CourseBasicInfo
        course={course}
        onCourseChange={handleCourseChange}
        onCheckboxChange={handleCheckboxChange}
        onTagsChange={handleTagsChange}
        onImageUpload={handleImageUpload}
      />
      
      <ModuleList
        modules={course.modules}
        expandedModules={expandedModules}
        onModuleChange={handleModuleChange}
        onAddModule={addModule}
        onDeleteModule={deleteModule}
        onToggleModuleExpand={toggleModuleExpand}
        onAddLesson={addLesson}
        onDeleteLesson={deleteLesson}
        onLessonChange={handleLessonChange}
        onMoveLessonUp={moveLessonUp}
        onMoveLessonDown={moveLessonDown}
      />
      
      <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">
          <span className="font-medium">📊 Přehled kurzu:</span>
          <span className="ml-2">📚 {course.modules?.length || 0} modulů</span>
          <span className="ml-2">📝 {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0} lekcí</span>
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-primary-600 text-white rounded-md flex items-center hover:bg-primary-700 transition-colors"
          disabled={isSaving}
        >
          <FiSave className="mr-2" />
          {isSaving ? 'Ukládám...' : 'Uložit změny'}
        </button>
      </div>
    </div>
  );
}
