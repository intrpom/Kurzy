'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash, FiEye, FiPlus } from 'react-icons/fi';
import { Course } from '@/types/course';
import { deleteCourse, createCourse } from '@/api/adminCourseList';

interface CourseListProps {
  courses: Course[];
  onCourseDeleted: () => void;
  onCourseCreated: (course: Course) => void;
}

/**
 * Komponenta pro zobrazení seznamu kurzů v administraci
 */
export default function CourseList({ courses, onCourseDeleted, onCourseCreated }: CourseListProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Formátování ceny
  const formatPrice = (price: number) => {
    if (price === 0) {
      return 'Zdarma';
    }
    return `${price} Kč`;
  };

  // Vytvoření nového kurzu
  const handleCreateCourse = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const newCourse = await createCourse();
      onCourseCreated(newCourse);
      router.push(`/admin/kurzy/${newCourse.id}`);
    } catch (error) {
      console.error('Chyba při vytváření kurzu:', error);
      alert('Nepodařilo se vytvořit nový kurz');
    } finally {
      setIsCreating(false);
    }
  };

  // Smazání kurzu
  const handleDeleteCourse = async (id: string) => {
    if (isDeleting) return;
    
    if (!window.confirm('Opravdu chcete smazat tento kurz? Tato akce je nevratná.')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      await deleteCourse(id);
      onCourseDeleted();
    } catch (error) {
      console.error('Chyba při mazání kurzu:', error);
      alert('Nepodařilo se smazat kurz');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Seznam kurzů</h2>
          <button
            onClick={handleCreateCourse}
            disabled={isCreating}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center disabled:opacity-50"
          >
            <FiPlus className="mr-2" /> {isCreating ? 'Vytváření...' : 'Nový kurz'}
          </button>
        </div>
      </div>
      
      {courses.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-neutral-500 mb-4">Zatím nemáte žádné kurzy.</p>
          <button
            onClick={handleCreateCourse}
            disabled={isCreating}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-flex items-center disabled:opacity-50"
          >
            <FiPlus className="mr-2" /> Vytvořit první kurz
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Název</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cena</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Doporučený</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Moduly</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Lekce</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {courses.map((course) => {
                const totalLessons = course.modules?.reduce(
                  (total, module) => total + (module.lessons?.length || 0),
                  0
                ) || 0;
                
                return (
                  <tr key={course.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{course.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {course.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatPrice(course.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {course.isFeatured ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Ano
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">
                          Ne
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {course.modules?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {totalLessons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/kurzy/${course.slug}`}
                          target="_blank"
                          className="text-neutral-600 hover:text-primary-600"
                          title="Zobrazit kurz"
                        >
                          <FiEye size={18} />
                        </Link>
                        <Link
                          href={`/admin/kurzy/${course.id}`}
                          className="text-neutral-600 hover:text-primary-600"
                          title="Upravit kurz"
                        >
                          <FiEdit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={isDeleting === course.id}
                          className="text-neutral-600 hover:text-red-600 disabled:opacity-50"
                          title="Smazat kurz"
                        >
                          <FiTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
