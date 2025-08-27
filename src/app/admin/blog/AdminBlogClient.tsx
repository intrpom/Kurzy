'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { FiPlus, FiEdit, FiTrash, FiEye, FiEyeOff, FiVideo } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface AdminBlogClientProps {
  initialPosts: BlogPost[];
}

export default function AdminBlogClient({ initialPosts }: AdminBlogClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funkce pro smazání blog postu
  const deleteBlogPost = async (postId: string) => {
    if (!window.confirm('Opravdu chcete smazat tento blog post? Tato akce je nevratná.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se smazat blog post');
      }

      // Odstranit z lokálního stavu
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Chyba při mazání blog postu:', error);
      setError('Nepodařilo se smazat blog post');
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro změnu stavu publikování
  const togglePublishStatus = async (postId: string, isPublished: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se změnit stav publikování');
      }

      // Aktualizovat lokální stav
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isPublished: !isPublished } : post
      ));
    } catch (error) {
      console.error('Chyba při změně stavu publikování:', error);
      setError('Nepodařilo se změnit stav publikování');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Neuvedeno';
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Správa blogu</h1>
          <p className="text-neutral-600">Celkem {posts.length} příspěvků</p>
        </div>
        <Link
          href="/admin/blog/novy"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 inline-flex items-center"
        >
          <FiPlus className="mr-2" />
          Nový příspěvek
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Seznam blog postů */}
      <div className="bg-white shadow-sm border border-neutral-200 rounded-lg overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">Zatím nemáte žádné blog posty.</p>
            <Link
              href="/admin/blog/novy"
              className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <FiPlus className="mr-1" />
              Vytvořit první příspěvek
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Název
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Stav
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Publikováno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Vytvořeno
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 flex items-center">
                          {post.videoUrl && (
                            <FiVideo className="mr-2 text-primary-600" title="Obsahuje video" />
                          )}
                          {post.title}
                        </div>
                        {post.subtitle && (
                          <div className="text-sm text-neutral-500">{post.subtitle}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.isPublished ? 'Publikováno' : 'Koncept'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Náhled */}
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-neutral-600 hover:text-neutral-700 p-1"
                          title="Náhled"
                          target="_blank"
                        >
                          <FiEye size={16} />
                        </Link>
                        
                        {/* Editace */}
                        <Link
                          href={`/admin/blog/${post.slug}`}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Upravit"
                        >
                          <FiEdit size={16} />
                        </Link>
                        
                        {/* Publikování/Skrytí */}
                        <button
                          onClick={() => togglePublishStatus(post.id, post.isPublished)}
                          className={`p-1 ${
                            post.isPublished 
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                          title={post.isPublished ? 'Skrýt' : 'Publikovat'}
                          disabled={loading}
                        >
                          {post.isPublished ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                        
                        {/* Smazání */}
                        <button
                          onClick={() => deleteBlogPost(post.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Smazat"
                          disabled={loading}
                        >
                          <FiTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
