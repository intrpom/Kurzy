'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// AdminLayout je poskytován automaticky přes layout.tsx
import { BlogPost } from '@/types/blog';
import { FiPlus, FiEdit, FiTrash, FiEye, FiEyeOff, FiVideo } from 'react-icons/fi';

// Funkce pro načítání blog postů
async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('/api/blog?published=false'); // Načti všechny, i nevydané
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst blog posty');
    }
    return response.json();
  } catch (error) {
    console.error('Chyba při načítání blog postů:', error);
    return [];
  }
}

// Funkce pro formátování délky videa
function formatDuration(minutes?: number): string {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
}

// Funkce pro formátování počtu zobrazení
function formatViews(views: number): string {
  if (views < 1000) return `${views}`;
  if (views < 1000000) return `${(views / 1000).toFixed(1)}k`;
  return `${(views / 1000000).toFixed(1)}M`;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Načtení blog postů
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const blogPosts = await loadBlogPosts();
        setPosts(blogPosts);
      } catch (err) {
        setError('Nepodařilo se načíst blog posty');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // Funkce pro smazání blog postu
  const handleDelete = async (slug: string) => {
    if (!confirm('Opravdu chcete smazat tento blog post? Tato akce je nevratná.')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se smazat blog post');
      }

      // Refresh seznam
      const updatedPosts = await loadBlogPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Chyba při mazání blog postu:', error);
      alert('Nepodařilo se smazat blog post');
    }
  };

  // Funkce pro toggle published status
  const handleTogglePublished = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/blog/${post.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          isPublished: !post.isPublished,
        }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se aktualizovat blog post');
      }

      // Refresh seznam
      const updatedPosts = await loadBlogPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Chyba při aktualizaci blog postu:', error);
      alert('Nepodařilo se aktualizovat blog post');
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-neutral-900">
              Správa Blog videí
            </h1>
            <p className="text-neutral-600 mt-1">
              Spravuj videa na blogu, přidávej nové a upravuj existující
            </p>
          </div>
          <Link 
            href="/admin/blog/novy"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Přidat video
          </Link>
        </div>

        {/* Obsah */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
              <p className="text-neutral-500 mt-4">Načítání blog postů...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiVideo className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Žádná videa</h3>
              <p className="text-neutral-600 mb-4">Zatím jsi nepřidal žádná videa na blog.</p>
              <Link 
                href="/admin/blog/novy"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                Přidat první video
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Délka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Zobrazení
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Datum
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
                        <div className="flex items-center">
                          {/* Thumbnail */}
                          <div className="w-16 h-10 bg-neutral-100 rounded overflow-hidden mr-4 flex-shrink-0">
                            {post.thumbnailUrl ? (
                              <img 
                                src={post.thumbnailUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                                <FiVideo className="w-4 h-4 text-primary-600" />
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-neutral-900 truncate">
                              {post.title}
                            </h3>
                            {post.subtitle && (
                              <p className="text-sm text-neutral-500 truncate mt-1">
                                {post.subtitle}
                              </p>
                            )}
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <span 
                                    key={tag}
                                    className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {post.tags.length > 3 && (
                                  <span className="text-xs text-neutral-500">
                                    +{post.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDuration(post.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatViews(post.views)} shlédnutí
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePublished(post)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.isPublished ? (
                            <>
                              <FiEye className="mr-1" />
                              Publikováno
                            </>
                          ) : (
                            <>
                              <FiEyeOff className="mr-1" />
                              Skryto
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(post.publishedAt).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Zobrazit na webu"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/blog/${post.slug}`}
                            className="text-neutral-600 hover:text-neutral-900 p-1"
                            title="Editovat"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.slug)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Smazat"
                          >
                            <FiTrash className="w-4 h-4" />
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
