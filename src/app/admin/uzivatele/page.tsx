'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiUser, FiBook, FiCalendar, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';

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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Načtení seznamu uživatelů
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) {
        throw new Error(`API odpověděla s chybou: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Chyba při načítání uživatelů:', error);
      setError('Nepodařilo se načíst seznam uživatelů');
    } finally {
      setLoading(false);
    }
  };

  // Načtení uživatelů při prvním renderu
  useEffect(() => {
    fetchUsers();
  }, []);

  // Formátování data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Změna stránky
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchUsers(newPage);
  };

  // Zobrazení detailu uživatele
  const showUserDetail = (user: User) => {
    setSelectedUser(user);
  };

  // Zavření detailu uživatele
  const closeUserDetail = () => {
    setSelectedUser(null);
  };

  // Zobrazení potvrzovacího dialogu pro smazání
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  // Zrušení mazání
  const cancelDelete = () => {
    setUserToDelete(null);
  };

  // Smazání uživatele
  const deleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Úspěšné smazání - aktualizujeme seznam uživatelů
        alert(`Uživatel ${userToDelete.email} byl úspěšně smazán`);
        fetchUsers(pagination.page); // Znovu načteme aktuální stránku
        setUserToDelete(null);
      } else {
        alert(data.error || 'Nepodařilo se smazat uživatele');
      }
    } catch (error) {
      console.error('Chyba při mazání uživatele:', error);
      alert('Nepodařilo se smazat uživatele');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-neutral-500">Načítání uživatelů...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-bold">Správa uživatelů</h1>
      </div>

      {/* Tabulka uživatelů */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Uživatel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Kurzy
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Registrace
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {user.name || 'Nepojmenovaný uživatel'}
                        </div>
                        <div className="text-sm text-neutral-500 flex items-center">
                          <FiMail className="mr-1" size={12} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Uživatel'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiBook className="mr-2 text-neutral-500" />
                      <span>{user.coursesCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => showUserDetail(user)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => confirmDeleteUser(user)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      title="Smazat uživatele"
                    >
                      <FiTrash2 className="mr-1" size={14} />
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stránkování */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-neutral-700">
                  Zobrazeno <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> až{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  z <span className="font-medium">{pagination.total}</span> uživatelů
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="sr-only">Předchozí</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? 'text-neutral-300 cursor-not-allowed'
                        : 'text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="sr-only">Další</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal s detailem uživatele */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-bold">Detail uživatele</h2>
                <button
                  onClick={closeUserDetail}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Základní informace */}
                <div className="bg-neutral-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-3">Základní informace</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Jméno</p>
                      <p className="font-medium">{selectedUser.name || 'Nepojmenovaný uživatel'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Role</p>
                      <p className="font-medium">{selectedUser.role === 'admin' ? 'Administrátor' : 'Uživatel'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Datum registrace</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Seznam kurzů */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Kurzy uživatele ({selectedUser.coursesCount})</h3>
                  
                  {selectedUser.courses.length === 0 ? (
                    <p className="text-neutral-500 italic">Uživatel nemá žádné kurzy</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.courses.map((course) => (
                        <div key={course.id} className="border border-neutral-200 rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{course.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              course.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {course.completed ? 'Dokončeno' : `${course.progress}% hotovo`}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Link 
                              href={`/kurzy/${course.slug}`}
                              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                              target="_blank"
                            >
                              Zobrazit kurz <FiChevronRight className="ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Potvrzovací dialog pro smazání uživatele */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="text-red-600" size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">
                    Smazat uživatele
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Tato akce je nevratná
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-neutral-700">
                  Opravdu chcete smazat uživatele{' '}
                  <strong>{userToDelete.email}</strong>?
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  Budou smazána všechna data uživatele včetně:
                </p>
                <ul className="text-sm text-neutral-500 mt-1 ml-4 list-disc">
                  <li>Přístup ke všem kurzům ({userToDelete.coursesCount})</li>
                  <li>Všechny autentizační tokeny</li>
                  <li>Veškerý postup v kurzech</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300"
                  disabled={isDeleting}
                >
                  Zrušit
                </button>
                <button
                  onClick={deleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Mazání...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="mr-2" size={14} />
                      Smazat uživatele
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
