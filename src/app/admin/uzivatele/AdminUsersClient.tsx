'use client';

import { useState } from 'react';
import { FiMail, FiUser, FiBook, FiCalendar, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  slug: string;
  progress: number;
  completed: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  coursesCount: number;
  courses: Course[];
}

interface AvailableCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersData {
  users: User[];
  pagination: PaginationInfo;
  availableCourses: AvailableCourse[];
}

interface AdminUsersClientProps {
  initialData: UsersData;
}

export default function AdminUsersClient({ initialData }: AdminUsersClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [pagination] = useState<PaginationInfo>(initialData.pagination);
  const [availableCourses] = useState<AvailableCourse[]>(initialData.availableCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const addCourseToUser = async (userId: string, courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users/add-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, courseId }),
      });

      if (!response.ok) {
        throw new Error(`Chyba při přidávání kurzu: ${response.status}`);
      }

      // Refresh stránky pro aktualizaci dat
      router.refresh();
      setSelectedUser(null);
      setSelectedCourse('');
    } catch (err) {
      console.error('Chyba při přidávání kurzu:', err);
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm('Opravdu chcete smazat tohoto uživatele? Tato akce je nevratná.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Chyba při mazání uživatele: ${response.status}`);
      }

      const result = await response.json();

      // Odstranit uživatele ze stavu
      setUsers(users.filter(user => user.id !== userId));
      
      // Zobrazit úspěšnou zprávu
      alert(`Uživatel byl úspěšně smazán: ${result.message || 'Operace dokončena'}`);
    } catch (err) {
      console.error('Chyba při mazání uživatele:', err);
      const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba';
      
      // Pokud uživatel nebyl nalezen (404), odstraníme ho ze seznamu
      // protože to znamená, že už neexistuje v databázi
      if (errorMessage.includes('Uživatel nebyl nalezen')) {
        setUsers(users.filter(user => user.id !== userId));
        alert('Uživatel už byl dříve smazán a byl odstraněn ze seznamu.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/admin/uzivatele?page=${newPage}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Správa uživatelů</h1>
          <p className="text-neutral-600">Celkem {pagination.totalUsers} uživatelů</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Uživatelé */}
      <div className="bg-white shadow-sm border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Uživatel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Kurzy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Registrace
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FiUser className="mr-3 text-neutral-400" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          {user.name || 'Bez jména'}
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center">
                          <FiMail className="mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Administrátor' : 'Uživatel'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-neutral-900">
                      <FiBook className="mr-1" />
                      {user.coursesCount} kurzů
                    </div>
                    {user.courses.length > 0 && (
                      <div className="mt-1">
                        {user.courses.slice(0, 2).map((course) => (
                          <div key={course.id} className="text-xs text-neutral-500">
                            {course.title} ({course.progress}%)
                          </div>
                        ))}
                        {user.courses.length > 2 && (
                          <div className="text-xs text-neutral-400">
                            +{user.courses.length - 2} dalších
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-neutral-500">
                      <FiCalendar className="mr-1" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Přidat kurz"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Smazat uživatele"
                        disabled={isLoading}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-neutral-700">
            Stránka {pagination.currentPage} z {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              <FiChevronLeft className="inline mr-1" />
              Předchozí
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Další
              <FiChevronRight className="inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Modal pro přidání kurzu */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Přidat kurz pro {selectedUser.name || selectedUser.email}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Vyberte kurz:
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Vyberte kurz --</option>
                {availableCourses
                  .filter(course => !selectedUser.courses.some(uc => uc.id === course.id))
                  .map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.price === 0 ? 'Zdarma' : `${course.price} Kč`})
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedCourse('');
                }}
                className="px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50"
                disabled={isLoading}
              >
                Zrušit
              </button>
              <button
                onClick={() => {
                  if (selectedCourse) {
                    addCourseToUser(selectedUser.id, selectedCourse);
                  }
                }}
                disabled={!selectedCourse || isLoading}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Přidávám...' : 'Přidat kurz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
