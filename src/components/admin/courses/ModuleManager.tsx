'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiEdit, FiTrash, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Course, Module } from '@/types/course';
import MaterialManager from './MaterialManager';

interface ModuleManagerProps {
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course | null>>;
  expandedModules?: Record<string, boolean>;
  onModuleChange?: (moduleId: string, field: string, value: string) => void;
  onAddModule?: () => void;
  onDeleteModule?: (moduleId: string) => void;
  onToggleModuleExpand?: (moduleId: string) => void;
  onAddLesson?: (moduleId: string) => void;
  onDeleteLesson?: (moduleId: string, lessonId: string) => void;
  onLessonChange: (moduleId: string, lessonId: string, field: string, value: string) => void;
  onMoveLessonUp?: (moduleId: string, lessonId: string) => void;
  onMoveLessonDown?: (moduleId: string, lessonId: string) => void;
}

/**
 * Komponenta pro správu modulů kurzu
 */
export default function ModuleManager({
  course,
  setCourse,
  expandedModules = {},
  onModuleChange,
  onAddModule,
  onDeleteModule,
  onToggleModuleExpand,
  onAddLesson,
  onDeleteLesson,
  onLessonChange,
  onMoveLessonUp,
  onMoveLessonDown
}: ModuleManagerProps) {
  // Implementace výchozích handleru pokud nejsou poskytnuty
  const handleModuleChange = (moduleId: string, field: string, value: string) => {
    // Zpracování prázdné hodnoty videoLibraryId jako null
    if (field === 'videoLibraryId' && value === '') {
      value = null as any;
    }
    
    if (onModuleChange) {
      onModuleChange(moduleId, field, value);
    } else {
      setCourse(currentCourse => {
        if (!currentCourse) return currentCourse;
        return {
          ...currentCourse,
          modules: currentCourse.modules.map(module => 
            module.id === moduleId ? { ...module, [field]: value } : module
          )
        };
      });
    }
  };
  
  const handleAddModule = () => {
    if (onAddModule) {
      onAddModule();
    }
  };
  
  const handleDeleteModule = (moduleId: string) => {
    if (onDeleteModule) {
      onDeleteModule(moduleId);
    } else {
      if (window.confirm('Opravdu chcete smazat tento modul? Budou smazány i všechny jeho lekce.')) {
        setCourse(currentCourse => {
          if (!currentCourse) return currentCourse;
          return {
            ...currentCourse,
            modules: currentCourse.modules.filter(module => module.id !== moduleId)
          };
        });
      }
    }
  };
  
  const handleToggleModuleExpand = (moduleId: string) => {
    if (onToggleModuleExpand) {
      onToggleModuleExpand(moduleId);
    }
  };
  
  const handleAddLesson = (moduleId: string) => {
    if (onAddLesson) {
      onAddLesson(moduleId);
    } else {
      setCourse(currentCourse => {
        if (!currentCourse) return currentCourse;
        return {
          ...currentCourse,
          modules: currentCourse.modules.map(module => {
            if (module.id === moduleId) {
              // Určit pořadí nové lekce - bude poslední v seznamu
              const maxOrder = module.lessons.length > 0
                ? Math.max(...module.lessons.map(lesson => lesson.order || 0))
                : 0;
              const newOrder = maxOrder + 1;
              
              const newLesson = {
                id: crypto.randomUUID(),
                title: 'Nová lekce',
                description: '',
                videoUrl: '',
                duration: 0,
                order: newOrder // Přidáno pořadí
              };
              return {
                ...module,
                lessons: [...module.lessons, newLesson]
              };
            }
            return module;
          })
        };
      });
    }
  };
  
  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (onDeleteLesson) {
      onDeleteLesson(moduleId, lessonId);
    } else {
      if (window.confirm('Opravdu chcete smazat tuto lekci?')) {
        setCourse(currentCourse => {
          if (!currentCourse) return currentCourse;
          return {
            ...currentCourse,
            modules: currentCourse.modules.map(module => {
              if (module.id === moduleId) {
                return {
                  ...module,
                  lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
                };
              }
              return module;
            })
          };
        });
      }
    }
  };
  
  const handleLessonChange = (moduleId: string, lessonId: string, field: string, value: any) => {
    if (onLessonChange) {
      onLessonChange(moduleId, lessonId, field, value);
    } else {
      setCourse(currentCourse => {
        if (!currentCourse) return currentCourse;
        return {
          ...currentCourse,
          modules: currentCourse.modules.map(module => {
            if (module.id === moduleId) {
              return {
                ...module,
                lessons: module.lessons.map(lesson => {
                  if (lesson.id === lessonId) {
                    return { ...lesson, [field]: value };
                  }
                  return lesson;
                })
              };
            }
            return module;
          })
        };
      });
    }
  };
  // Kontrola, zda každý modul má inicializované pole lekcí
  if (course.modules && course.modules.length > 0) {
    course.modules.forEach((module, index) => {
      if (!module.lessons) {
        // Pouze varování o chybějících lekcích je důležité
        console.warn(`Modul ${index} (${module.title}) nemá inicializované pole lekcí!`);
        module.lessons = [];
      }
      
      // Kontrola, zda každá lekce má inicializované pole materiálů
      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.materials) {
          console.warn(`Lekce ${lessonIndex} (${lesson.title}) v modulu ${module.title} nemá inicializované pole materiálů!`);
          lesson.materials = [];
        }
      });
    });
  }
  // Odstraněny zbytečné logy
  
  // Kontrola, zda moduly existují a jsou správně inicializovány
  const modules = course.modules || [];
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Moduly a lekce</h2>
        <button
          type="button"
          onClick={handleAddModule}
          className="flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <FiPlus className="mr-1" /> Přidat modul
        </button>
      </div>
      
      {modules.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
          <p className="text-neutral-600">Tento kurz zatím nemá žádné moduly.</p>
          <button
            type="button"
            onClick={handleAddModule}
            className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <FiPlus className="inline mr-1" /> Přidat první modul
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module: Module, index: number) => (
            <div key={module.id} className="border border-neutral-200 rounded-md overflow-hidden">
              {/* Module header */}
              <div className="bg-neutral-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Modul {index + 1}:</span>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                      className="border border-neutral-300 rounded-md p-1"
                      placeholder="Název modulu"
                    />
                    <label className="block text-xs font-medium mb-1 ml-4">
                      ID knihovny Bunny.net (volitelné)
                    </label>
                    <input
                      type="text"
                      value={module.videoLibraryId || ''}
                      onChange={(e) => handleModuleChange(module.id, 'videoLibraryId', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                      placeholder="Pokud není zadáno, použije se ID z kurzu"
                    />
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleExpand(module.id)}
                      className="p-1 text-neutral-600 hover:text-primary-600 mr-2"
                      aria-label={expandedModules[module.id] ? 'Sbalit modul' : 'Rozbalit modul'}
                    >
                      {expandedModules[module.id] ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteModule(module.id)}
                      className="p-1 text-neutral-600 hover:text-red-600"
                      aria-label="Smazat modul"
                    >
                      <FiTrash />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Module content (expanded) */}
              {expandedModules[module.id] && (
                <div className="p-4 border-t border-neutral-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Popis modulu
                    </label>
                    <textarea
                      value={module.description || ''}
                      onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
                      className="w-full p-2 border border-neutral-300 rounded-md"
                      rows={2}
                      placeholder="Krátký popis modulu"
                    />
                  </div>
                  
                  {/* Lessons */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium">Lekce</h3>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(module.id)}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center text-sm"
                      >
                        <FiPlus className="mr-1" /> Přidat lekci
                      </button>
                    </div>
                    
                    {module.lessons.length === 0 ? (
                      <p className="text-neutral-500 italic text-sm">Modul zatím nemá žádné lekce. Přidejte první lekci pomocí tlačítka výše.</p>
                    ) : (
                      <div className="space-y-3">
                        {module.lessons.map((lesson: any, lessonIndex: number) => (
                          <div key={lesson.id} className="border border-neutral-200 rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="text-sm font-medium mr-2">Lekce {lessonIndex + 1}:</span>
                                <input
                                  type="text"
                                  value={lesson.title}
                                  onChange={(e) => handleLessonChange(module.id, lesson.id, 'title', e.target.value)}
                                  className="border border-neutral-300 rounded-md p-1 text-sm"
                                  placeholder="Název lekce"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Tlačítka pro přesouvání lekcí */}
                                {onMoveLessonUp && (
                                  <button
                                    type="button"
                                    onClick={() => onMoveLessonUp(module.id, lesson.id)}
                                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    disabled={lessonIndex === 0}
                                    title="Posunout lekci nahoru"
                                  >
                                    <FiArrowUp size={12} />
                                  </button>
                                )}
                                {onMoveLessonDown && (
                                  <button
                                    type="button"
                                    onClick={() => onMoveLessonDown(module.id, lesson.id)}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    disabled={lessonIndex === module.lessons.length - 1}
                                    title="Posunout lekci dolů"
                                  >
                                    <FiArrowDown size={12} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                  className="p-1 text-neutral-600 hover:text-red-600"
                                  aria-label="Smazat lekci"
                                >
                                  <FiTrash size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  Popis lekce
                                </label>
                                <textarea
                                  value={lesson.description || ''}
                                  onChange={(e) => handleLessonChange(module.id, lesson.id, 'description', e.target.value)}
                                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                                  rows={2}
                                  placeholder="Krátký popis lekce"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  ID videa z Bunny.net
                                </label>
                                <input
                                  type="text"
                                  value={lesson.videoUrl || ''}
                                  onChange={(e) => handleLessonChange(module.id, lesson.id, 'videoUrl', e.target.value)}
                                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                                  placeholder="260184"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  ID knihovny Bunny.net (volitelné)
                                </label>
                                <input
                                  type="text"
                                  value={lesson.videoLibraryId || ''}
                                  onChange={(e) => handleLessonChange(module.id, lesson.id, 'videoLibraryId', e.target.value === '' ? null : e.target.value)}
                                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                                  placeholder="12345"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  Délka lekce (minuty)
                                </label>
                                <input
                                  type="number"
                                  value={lesson.duration || ''}
                                  onChange={(e) => handleLessonChange(module.id, lesson.id, 'duration', e.target.value)}
                                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                                  placeholder="15"
                                  min="1"
                                />
                              </div>
                              
                              {/* Správa materiálů */}
                              <div className="col-span-1 md:col-span-2 mt-2">
                                <MaterialManager
                                  materials={lesson.materials || []}
                                  onMaterialsChange={(materials) => {
                                    handleLessonChange(module.id, lesson.id, 'materials', materials);
                                  }}
                                  moduleId={module.id}
                                  lessonId={lesson.id}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
