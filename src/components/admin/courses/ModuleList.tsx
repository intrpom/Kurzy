'use client';

import { useState } from 'react';
import { FiPlus, FiChevronDown, FiChevronUp, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Module } from '@/types/course';
import LessonList from './LessonList';

interface ModuleListProps {
  modules: Module[];
  expandedModules: Record<string, boolean>;
  onModuleChange: (moduleId: string, field: string, value: string) => void;
  onAddModule: () => void;
  onDeleteModule: (moduleId: string) => void;
  onToggleModuleExpand: (moduleId: string) => void;
  onAddLesson: (moduleId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onLessonChange: (moduleId: string, lessonId: string, field: string, value: string) => void;
  onMoveLessonUp?: (moduleId: string, lessonId: string) => void;
  onMoveLessonDown?: (moduleId: string, lessonId: string) => void;
}

export default function ModuleList({
  modules,
  expandedModules,
  onModuleChange,
  onAddModule,
  onDeleteModule,
  onToggleModuleExpand,
  onAddLesson,
  onDeleteLesson,
  onLessonChange,
  onMoveLessonUp,
  onMoveLessonDown
}: ModuleListProps) {
  
  const handleModuleChange = (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onModuleChange(moduleId, name, value);
  };

  const confirmDeleteModule = (moduleId: string) => {
    if (window.confirm('Opravdu chcete smazat tento modul a všechny jeho lekce?')) {
      onDeleteModule(moduleId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">Moduly kurzu</h2>
        <button
          type="button"
          onClick={onAddModule}
          className="px-3 py-2 bg-primary-600 text-white rounded-md flex items-center text-sm"
        >
          <FiPlus className="mr-1" /> Přidat modul
        </button>
      </div>
      
      {modules.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p>Tento kurz zatím nemá žádné moduly</p>
          <button
            type="button"
            onClick={onAddModule}
            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md flex items-center mx-auto"
          >
            <FiPlus className="mr-2" /> Přidat první modul
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border border-neutral-200 rounded-md overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-neutral-50 cursor-pointer"
                onClick={() => onToggleModuleExpand(module.id)}
              >
                <div className="flex items-center">
                  <span className="font-medium">
                    Modul {moduleIndex + 1}: {module.title}
                  </span>
                  <span className="ml-2 text-sm text-neutral-500">
                    ({module.lessons.length} lekcí)
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteModule(module.id);
                    }}
                    className="ml-2 p-1 text-neutral-500 hover:text-red-500"
                  >
                    <FiTrash2 />
                  </button>
                  {expandedModules[module.id] ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>
              
              {expandedModules[module.id] && (
                <div className="p-4 border-t border-neutral-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor={`module-${module.id}-title`}>
                      Název modulu
                    </label>
                    <input
                      type="text"
                      id={`module-${module.id}-title`}
                      name="title"
                      value={module.title}
                      onChange={(e) => handleModuleChange(module.id, e)}
                      className="w-full p-2 border border-neutral-300 rounded-md"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">Lekce</h3>
                      <button
                        type="button"
                        onClick={() => onAddLesson(module.id)}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md flex items-center text-sm"
                      >
                        <FiPlus className="mr-1" /> Přidat lekci
                      </button>
                    </div>
                    
                    <LessonList
                      moduleId={module.id}
                      lessons={module.lessons}
                      onLessonChange={onLessonChange}
                      onDeleteLesson={onDeleteLesson}
                      onMoveLessonUp={onMoveLessonUp}
                      onMoveLessonDown={onMoveLessonDown}
                    />
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
