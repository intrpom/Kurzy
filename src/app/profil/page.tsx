'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MainLayout from '@/app/MainLayout';
import { FiUser, FiMail, FiShield, FiTrash2, FiAlertTriangle, FiEdit2, FiSave, FiX } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, loading, isInitialized, logout, updateUser } = useAuth();
  const router = useRouter();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Stavy pro editaci jména
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Pokud není uživatel přihlášen, přesměruj na login
  // Čekáme na inicializaci GlobalAuthState před přesměrováním
  if (isInitialized && !user) {
    router.push('/auth/login');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="container-custom py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
              <p className="mt-4 text-lg">Načítám profil...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  const startEditingName = () => {
    setEditedName(user.name || '');
    setIsEditingName(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
    setUpdateError(null);
  };

  const saveNameChanges = async () => {
    setIsUpdatingName(true);
    setUpdateError(null);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: editedName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při aktualizaci jména');
      }

      const data = await response.json();
      
      // Aktualizuj context uživatele s novými daty
      updateUser({ name: editedName });
      
      setUpdateSuccess(true);
      setIsEditingName(false);
      
      // Skryj success zprávu po 3 sekundách
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Chyba při aktualizaci jména:', error);
      setUpdateError(error instanceof Error ? error.message : 'Neznámá chyba');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při mazání účtu');
      }

      // Úspěšné smazání - odhlásit uživatele a přesměrovat
      await logout();
      alert('Váš účet byl úspěšně smazán.');
      router.push('/');
    } catch (error) {
      console.error('Chyba při mazání účtu:', error);
      setDeleteError(error instanceof Error ? error.message : 'Neznámá chyba');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-8">Můj profil</h1>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Informace o účtu</h2>
            
            {/* Success message */}
            {updateSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
                <p className="text-sm text-green-700">Jméno bylo úspěšně aktualizováno!</p>
              </div>
            )}
            
            {/* Error message */}
            {updateError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-sm text-red-700">{updateError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <FiUser className="mr-3 text-neutral-500" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600">Jméno</p>
                    {isEditingName ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Zadejte své jméno"
                          disabled={isUpdatingName}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveNameChanges();
                            } else if (e.key === 'Escape') {
                              cancelEditingName();
                            }
                          }}
                        />
                        <button
                          onClick={saveNameChanges}
                          disabled={isUpdatingName}
                          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Uložit"
                        >
                          <FiSave size={16} />
                        </button>
                        <button
                          onClick={cancelEditingName}
                          disabled={isUpdatingName}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Zrušit"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="font-medium">{user.name || 'Neuvedeno'}</p>
                    )}
                  </div>
                </div>
                {!isEditingName && (
                  <button
                    onClick={startEditingName}
                    className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-md transition-colors"
                    title="Upravit jméno"
                  >
                    <FiEdit2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center">
                <FiMail className="mr-3 text-neutral-500" />
                <div>
                  <p className="text-sm text-neutral-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiShield className="mr-3 text-neutral-500" />
                <div>
                  <p className="text-sm text-neutral-600">Role</p>
                  <p className="font-medium">
                    {user.role === 'ADMIN' ? 'Administrátor' : 'Uživatel'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Rychlé akce</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/moje-kurzy')}
                className="w-full text-left p-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="font-medium">Moje kurzy</div>
                <div className="text-sm text-neutral-600">Přejít na seznam vašich kurzů</div>
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full text-left p-3 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="font-medium">Administrace</div>
                  <div className="text-sm text-neutral-600">Správa aplikace</div>
                </button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Nebezpečná zóna</h2>
            
            <div className="border border-red-200 rounded-md p-4 bg-red-50">
              <div className="flex items-start">
                <FiAlertTriangle className="mr-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 mb-2">Smazat účet</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Tato akce je nevratná. Budou smazána všechna vaše data včetně přístupu ke kurzům.
                  </p>
                  
                  {deleteError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  )}
                  
                  {!showDeleteConfirmation ? (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                      disabled={isDeleting}
                    >
                      <FiTrash2 className="mr-2" />
                      Smazat můj účet
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-800">
                        Opravdu chcete smazat svůj účet? Napište "SMAZAT" pro potvrzení:
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="SMAZAT"
                          className="flex-1 px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value === 'SMAZAT') {
                              handleDeleteAccount();
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="SMAZAT"]') as HTMLInputElement;
                            if (input?.value === 'SMAZAT') {
                              handleDeleteAccount();
                            } else {
                              alert('Musíte napsat přesně "SMAZAT"');
                            }
                          }}
                          disabled={isDeleting}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? 'Mažu...' : 'Potvrdit'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirmation(false)}
                          disabled={isDeleting}
                          className="bg-neutral-300 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
