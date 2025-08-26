'use client';

import { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiPlay, FiFile, FiHeadphones, FiLink, FiCheck } from 'react-icons/fi';
import { Module, Lesson } from '@/types/course';

interface ModuleAccordionProps {
  module: Module;
  index: number;
  isActive?: boolean;
  onLessonClick?: (lessonId: string) => void;
  currentLessonId?: string;
}

export default function ModuleAccordion({ 
  module, 
  index, 
  isActive = false,
  onLessonClick,
  currentLessonId
}: ModuleAccordionProps) {
  // Kontrola a inicializace pole lekcí
  if (!module.lessons) {
    console.warn(`ModuleAccordion: Modul ${module.title} nemá inicializované pole lekcí!`);
    module.lessons = [];
  }
  
  // Kontrola a inicializace pole materiálů pro každou lekci
  module.lessons = module.lessons.map(lesson => {
    if (!lesson.materials) {
      console.warn(`ModuleAccordion: Lekce ${lesson.title} v modulu ${module.title} nemá inicializované pole materiálů!`);
      lesson.materials = [];
    }
    return lesson;
  });
  
  const [isOpen, setIsOpen] = useState(isActive);
  const currentLessonRef = useRef<HTMLDivElement>(null);
  
  // Automatické otevření modulu, pokud obsahuje aktuální lekci
  useEffect(() => {
    if (currentLessonId && module.lessons && module.lessons.some(lesson => lesson.id === currentLessonId)) {
      setIsOpen(true);
    }
  }, [currentLessonId, module.lessons]);
  
  // Automatické scrollování na aktuální lekci - pouze na desktopu
  useEffect(() => {
    if (currentLessonId && isOpen && currentLessonRef.current) {
      // Pouze na desktopu - na mobilech to způsobuje konflikty se scrollem na video
      const isMobile = window.innerWidth < 1024 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        setTimeout(() => {
          currentLessonRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    }
  }, [currentLessonId, isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleLessonClick = (lessonId: string) => {
    if (onLessonClick) {
      onLessonClick(lessonId);
    }
  };

  // Funkce pro zobrazení ikony typu materiálu
  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FiFile className="text-neutral-600" />;
      case 'audio':
        return <FiHeadphones className="text-neutral-600" />;
      case 'link':
        return <FiLink className="text-neutral-600" />;
      default:
        return <FiFile className="text-neutral-600" />;
    }
  };

  return (
    <div className="border border-neutral-200 rounded-md mb-4 overflow-hidden">
      <div 
        className={`flex justify-between items-center p-4 cursor-pointer ${isOpen ? 'bg-primary-50' : 'bg-white'}`}
        onClick={toggleOpen}
      >
        <div className="flex items-center">
          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 font-medium">
            {index + 1}
          </span>
          <div>
            <h3 className="font-medium">{module.title}</h3>
            <div className="flex items-center">
              <span className="text-sm text-neutral-600">
                {module.lessons.length} {module.lessons.length === 1 ? 'lekce' : module.lessons.length >= 2 && module.lessons.length <= 4 ? 'lekce' : 'lekcí'}
              </span>
            </div>
            {module.description && (
              <p className="text-sm text-neutral-600 mt-1">{module.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <FiChevronUp className="text-neutral-600" />
          ) : (
            <FiChevronDown className="text-neutral-600" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-neutral-200">
          {module.lessons.map((lesson, lessonIndex) => (
            <div 
              key={lesson.id}
              ref={currentLessonId === lesson.id ? currentLessonRef : null}
              className={`p-4 border-b border-neutral-100 last:border-b-0 ${currentLessonId === lesson.id ? 'bg-primary-50' : ''} ${onLessonClick ? 'cursor-pointer hover:bg-neutral-50' : ''}`}
              onClick={() => handleLessonClick(lesson.id)}
            >
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center mr-3 text-sm">
                  {lesson.completed ? (
                    <FiCheck className="text-green-600" />
                  ) : (
                    lessonIndex + 1
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium break-words leading-snug ${currentLessonId === lesson.id ? 'text-primary-700' : ''}`}>
                        {lesson.title}
                      </h4>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-neutral-600 flex items-center">
                        <FiPlay className="mr-1" />
                        {lesson.duration} min
                      </span>
                    </div>
                  </div>
                  
                  {lesson.materials && lesson.materials.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <ul className="space-y-2">
                        {/* Logování všech materiálů pro kontrolu */}
                        {lesson.materials.length > 0 && lesson.materials.some(m => m.title && m.title.includes('prozkoumejte')) ? 
                          (() => {
                            console.log('Debug materiály:', lesson.materials.map(m => ({ 
                              title: m.title || 'no title', 
                              content: m.content ? 'has content' : 'no content', 
                              url: m.url || 'no url' 
                            })));
                            return null;
                          })() : null
                        }
                        {lesson.materials
                          .filter(material => {
                            // Filtrujeme úvodní materiál v první lekci prvního modulu
                            const isIntroMaterial = index === 0 && lessonIndex === 0 && material.title === "Úvodní materiál";
                            
                            // Filtrujeme materiály, které mají obsah
                            const hasContent = material.content && material.content.trim().length > 0;
                            
                            // Filtrujeme materiály, jejichž URL začíná '#'
                            const hasInternalUrl = material.url && material.url.startsWith('#');
                            
                            // Filtrujeme materiály s konkrétním názvem
                            const isSpecificMaterial = material.title && 
                              (material.title.toLowerCase().includes('prozkoumejte') || 
                               material.title.toLowerCase().includes('pracovní'));
                            
                            // Zobrazit pouze materiály, které nejsou pracovní
                            return !isIntroMaterial && !hasContent && !hasInternalUrl && !isSpecificMaterial;
                          })
                          .map((material, idx) => (
                            <li key={idx} className="text-sm flex items-center">
                              {getMaterialIcon(material.type)}
                              <span className="ml-2">{material.title}</span>
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
