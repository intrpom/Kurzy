'use client';

import { FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Lesson } from '@/types/course';

interface LessonListProps {
  moduleId: string;
  lessons: Lesson[];
  onLessonChange: (moduleId: string, lessonId: string, field: string, value: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onMoveLessonUp?: (moduleId: string, lessonId: string) => void;
  onMoveLessonDown?: (moduleId: string, lessonId: string) => void;
}

export default function LessonList({
  moduleId,
  lessons,
  onLessonChange,
  onDeleteLesson,
  onMoveLessonUp,
  onMoveLessonDown
}: LessonListProps) {
  
  const handleLessonChange = (lessonId: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onLessonChange(moduleId, lessonId, name, value);
  };

  const confirmDeleteLesson = (lessonId: string) => {
    if (window.confirm('Opravdu chcete smazat tuto lekci?')) {
      onDeleteLesson(moduleId, lessonId);
    }
  };

  // Seřadit lekce podle vlastnosti order před zobrazením
  const sortedLessons = [...lessons].sort((a, b) => {
    // Pokud nemají order, použijeme jejich pozici v poli
    const orderA = a.order !== undefined ? a.order : 0;
    const orderB = b.order !== undefined ? b.order : 0;
    return orderA - orderB;
  });

  return (
    <div className="space-y-4">
      {sortedLessons.length === 0 ? (
        <div className="text-center py-4 text-neutral-500 border border-dashed border-neutral-300 rounded-md">
          <p>Tento modul zatím nemá žádné lekce</p>
        </div>
      ) : (
        sortedLessons.map((lesson, lessonIndex) => (
          <div key={lesson.id} className="border border-neutral-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Lekce {lessonIndex + 1}</h4>
              <div className="flex items-center gap-1">
                {/* Always show buttons for testing - remove conditions */}
                <button
                  type="button"
                  onClick={() => onMoveLessonUp && onMoveLessonUp(moduleId, lesson.id)}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded mr-1"
                  disabled={!onMoveLessonUp || lessonIndex === 0}
                  title="Posunout nahoru"
                >
                  ↑ UP
                </button>
                
                <button
                  type="button"
                  onClick={() => onMoveLessonDown && onMoveLessonDown(moduleId, lesson.id)}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded mr-1"
                  disabled={!onMoveLessonDown || lessonIndex === sortedLessons.length - 1}
                  title="Posunout dolů"
                >
                  ↓ DOWN
                </button>
                
                {/* Debug info */}
                <span className="text-xs bg-yellow-200 px-1 rounded mr-1">
                  UP:{onMoveLessonUp?'✓':'✗'} DOWN:{onMoveLessonDown?'✓':'✗'}
                </span>
                <button
                  type="button"
                  onClick={() => confirmDeleteLesson(lesson.id)}
                  className="p-1 text-neutral-500 hover:text-red-500"
                  title="Smazat lekci"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor={`lesson-${lesson.id}-title`}>
                  Název lekce
                </label>
                <input
                  type="text"
                  id={`lesson-${lesson.id}-title`}
                  name="title"
                  value={lesson.title}
                  onChange={(e) => handleLessonChange(lesson.id, e)}
                  className="w-full p-2 border border-neutral-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor={`lesson-${lesson.id}-description`}>
                  Popis lekce <span className="text-xs text-neutral-500">(podporuje Markdown)</span>
                </label>
                <textarea
                  id={`lesson-${lesson.id}-description`}
                  name="description"
                  value={lesson.description || ''}
                  onChange={(e) => handleLessonChange(lesson.id, e)}
                  rows={5}
                  className="w-full p-2 border border-neutral-300 rounded-md font-mono text-sm"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor={`lesson-${lesson.id}-videoUrl`}>
                  ID videa z Bunny.net
                </label>
                <input
                  type="text"
                  id={`lesson-${lesson.id}-videoUrl`}
                  name="videoUrl"
                  value={lesson.videoUrl || ''}
                  onChange={(e) => handleLessonChange(lesson.id, e)}
                  className="w-full p-2 border border-neutral-300 rounded-md"
                  placeholder="e3e4a4c0-34a0-45c3-a448-6d5bcd016cd9"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
