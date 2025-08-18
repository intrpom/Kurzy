import { Course } from '@/types/course';
import ModuleAccordion from './ModuleAccordion';
import { FiClock, FiBook, FiBarChart2 } from 'react-icons/fi';

interface CourseContentProps {
  course: Course;
  onLessonClick?: (lessonId: string) => void;
  currentLessonId?: string;
}

export default function CourseContent({ course, onLessonClick, currentLessonId }: CourseContentProps) {
  // Výpočet celkového počtu lekcí a délky kurzu
  const totalLessons = course.totalLessons || course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const totalDuration = course.totalDuration || course.modules.reduce((total, module) => 
    total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0), 0);
  
  // Převod minut na hodiny a minuty
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-serif font-bold mb-6">Obsah kurzu</h2>
      
      <div className="flex flex-wrap gap-6 mb-8">
        <div className="flex items-center">
          <FiBook className="text-primary-600 mr-2" />
          <span>{totalLessons} {totalLessons === 1 ? 'lekce' : totalLessons >= 2 && totalLessons <= 4 ? 'lekce' : 'lekcí'}</span>
        </div>
        <div className="flex items-center">
          <FiClock className="text-primary-600 mr-2" />
          <span>
            {hours > 0 ? `${hours} ${hours === 1 ? 'hodina' : hours >= 2 && hours <= 4 ? 'hodiny' : 'hodin'}` : ''}
            {hours > 0 && minutes > 0 ? ' a ' : ''}
            {minutes > 0 ? `${minutes} ${minutes === 1 ? 'minuta' : minutes >= 2 && minutes <= 4 ? 'minuty' : 'minut'}` : ''}
          </span>
        </div>
        {course.level && (
          <div className="flex items-center">
            <FiBarChart2 className="text-primary-600 mr-2" />
            <span>
              {course.level === 'beginner' ? 'Začátečník' : 
               course.level === 'intermediate' ? 'Mírně pokročilý' : 
               'Pokročilý'}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {course.modules.map((module, index) => (
          <ModuleAccordion 
            key={module.id} 
            module={module} 
            index={index}
            isActive={index === 0}
            onLessonClick={onLessonClick}
            currentLessonId={currentLessonId}
          />
        ))}
      </div>
    </div>
  );
}
