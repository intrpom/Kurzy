'use client';

import { useState, useEffect } from 'react';
import { Lesson, Module, Course } from '@/types/course';
import { FiDownload, FiHeadphones, FiLink, FiFile, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import BunnyVideoPlayer from '@/components/BunnyVideoPlayer';

interface LessonPlayerProps {
  course: Course;
  currentModuleId: string;
  currentLessonId: string;
  onLessonComplete?: (lessonId: string) => void;
  onNavigateLesson: (lessonId: string) => void;
}

export default function LessonPlayer({
  course,
  currentModuleId,
  currentLessonId,
  onLessonComplete,
  onNavigateLesson
}: LessonPlayerProps) {
  // Kontrola a inicializace pole modulů
  if (!course.modules) {
    console.warn('LessonPlayer: Kurz nemá inicializované pole modulů!');
    course.modules = [];
  }
  
  // Kontrola a inicializace pole lekcí pro každý modul
  course.modules = course.modules.map(module => {
    if (!module.lessons) {
      console.warn(`LessonPlayer: Modul ${module.title} nemá inicializované pole lekcí!`);
      module.lessons = [];
    }
    
    // Kontrola a inicializace pole materiálů pro každou lekci
    module.lessons = module.lessons.map(lesson => {
      if (!lesson.materials) {
        console.warn(`LessonPlayer: Lekce ${lesson.title} v modulu ${module.title} nemá inicializované pole materiálů!`);
        lesson.materials = [];
      }
      return lesson;
    });
    
    return module;
  });
  
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);

  // Najít aktuální modul a lekci
  useEffect(() => {
    if (!course.modules || course.modules.length === 0) {
      console.warn('LessonPlayer: Kurz nemá žádné moduly!');
      return;
    }
    
    const module = course.modules.find(m => m.id === currentModuleId);
    if (module) {
      setCurrentModule(module);
      
      if (!module.lessons || module.lessons.length === 0) {
        console.warn(`LessonPlayer: Modul ${module.title} nemá žádné lekce!`);
        return;
      }
      
      const lesson = module.lessons.find(l => l.id === currentLessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        setIsLessonCompleted(!!lesson.completed);
      } else {
        console.warn(`LessonPlayer: Lekce s ID ${currentLessonId} nebyla nalezena v modulu ${module.title}!`);
      }
    } else {
      console.warn(`LessonPlayer: Modul s ID ${currentModuleId} nebyl nalezen!`);
    }
  }, [course, currentModuleId, currentLessonId]);

  // Funkce pro navigaci na předchozí/další lekci
  const navigateToPreviousLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLessonId);
    if (currentLessonIndex > 0) {
      // Předchozí lekce ve stejném modulu
      onNavigateLesson(currentModule.lessons[currentLessonIndex - 1].id);
    } else {
      // Poslední lekce předchozího modulu
      const currentModuleIndex = course.modules.findIndex(m => m.id === currentModuleId);
      if (currentModuleIndex > 0) {
        const previousModule = course.modules[currentModuleIndex - 1];
        const lastLesson = previousModule.lessons[previousModule.lessons.length - 1];
        onNavigateLesson(lastLesson.id);
      }
    }
  };

  const navigateToNextLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLessonId);
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      // Další lekce ve stejném modulu
      onNavigateLesson(currentModule.lessons[currentLessonIndex + 1].id);
    } else {
      // První lekce dalšího modulu
      const currentModuleIndex = course.modules.findIndex(m => m.id === currentModuleId);
      if (currentModuleIndex < course.modules.length - 1) {
        const nextModule = course.modules[currentModuleIndex + 1];
        onNavigateLesson(nextModule.lessons[0].id);
      }
    }
  };

  const handleLessonComplete = () => {
    if (onLessonComplete && currentLessonId) {
      onLessonComplete(currentLessonId);
      setIsLessonCompleted(true);
    }
  };
  
  // Funkce pro extrakci ID videa z URL
  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // Zkusíme najít ID v různých formátech URL z Bunny.net
    try {
      // Formát: https://iframe.mediadelivery.net/embed/424657/abcd1234
      if (url.includes('iframe.mediadelivery.net/embed')) {
        const parts = url.split('/');
        return parts[parts.length - 1].split('?')[0];
      }
      
      // Formát: https://video.bunnycdn.com/play/424657/abcd1234
      if (url.includes('video.bunnycdn.com/play')) {
        const parts = url.split('/');
        return parts[parts.length - 1].split('?')[0];
      }
      
      // Formát: abcd1234 (pouze ID)
      if (url.match(/^[a-zA-Z0-9-_]{6,}$/)) {
        return url;
      }
      
      // Pokud je to jiný formát, vrátíme celou URL jako ID
      // V komponentě BunnyVideoPlayer bude zobrazena chybová hláška
      return url;
    } catch (error) {
      console.error('Chyba při extrakci ID videa:', error);
      return '';
    }
  };

  if (!currentLesson || !currentModule) {
    return <div className="p-8 text-center">Lekce nebyla nalezena</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Video přehrávač */}
      <div className="aspect-video bg-neutral-900 relative">
        {currentLesson.videoUrl ? (
          <BunnyVideoPlayer 
            videoId={extractVideoId(currentLesson.videoUrl)} 
            title={currentLesson.title}
            className="w-full h-full"
            libraryId={currentLesson.videoLibraryId || currentModule.videoLibraryId || course.videoLibraryId || '424657'} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-center text-neutral-400">Pro tuto lekci není k dispozici video</p>
          </div>
        )}
      </div>

      {/* Informace o lekci */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif font-bold">{currentLesson.title}</h2>
          <div className="flex items-center text-sm text-neutral-600">
            <span>{currentLesson.duration} min</span>
          </div>
        </div>

        {currentLesson.description && (
          <div className="mb-6">
            <p className="text-neutral-700">{currentLesson.description}</p>
          </div>
        )}

        {/* Materiály */}
        {currentLesson.materials && currentLesson.materials.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="space-y-3">
              {currentLesson.materials
                .filter(material => {
                  // Zjistíme, zda je aktuální lekce první lekcí prvního modulu
                  const isFirstModule = course.modules.findIndex(m => m.id === currentModuleId) === 0;
                  const isFirstLesson = isFirstModule && currentModule?.lessons.findIndex(l => l.id === currentLessonId) === 0;
                  
                  // Filtrujeme materiál s názvem "Úvodní materiál" v první lekci prvního modulu
                  return !(isFirstLesson && material.title === "Úvodní materiál");
                })
                .map((material, index) => (
                <div key={index} className="flex items-center p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                  {material.type === 'pdf' && <FiFile className="text-red-500 mr-3" />}
                  {material.type === 'audio' && <FiHeadphones className="text-blue-500 mr-3" />}
                  {material.type === 'link' && <FiLink className="text-green-500 mr-3" />}
                  {material.type === 'text' && <FiFile className="text-neutral-500 mr-3" />}
                  
                  <div className="flex-1">
                    <p className="font-medium">{material.title}</p>
                    {material.type === 'text' && material.content && (
                      <p className="text-sm text-neutral-600 mt-1">{material.content}</p>
                    )}
                  </div>
                  
                  {material.url && (
                    <a 
                      href={material.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <FiDownload className="mr-1" />
                      <span>Stáhnout</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigace a tlačítko pro dokončení */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
          <button
            onClick={navigateToPreviousLesson}
            className="btn-outline flex items-center"
          >
            <FiChevronLeft className="mr-2" /> Předchozí lekce
          </button>

          <button
            onClick={handleLessonComplete}
            className={`px-4 py-2 rounded-md flex items-center ${
              isLessonCompleted 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            disabled={isLessonCompleted}
          >
            {isLessonCompleted ? (
              <>
                <FiCheck className="mr-2" /> Dokončeno
              </>
            ) : (
              'Označit jako dokončené'
            )}
          </button>

          <button
            onClick={navigateToNextLesson}
            className="btn-outline flex items-center"
          >
            Další lekce <FiChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
