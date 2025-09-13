'use client';

import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/app/MainLayout';
import { FiPlay, FiCalendar, FiClock, FiEye } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { BlogPost } from '@/types/blog';

// Client komponenta - revalidace se nepoužívá

// Client-side funkce pro získání blog postů přes API
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch('/api/blog');
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst blog posty');
    }
    return await response.json();
  } catch (error) {
    console.error('Chyba při načítání blog postů:', error);
    return [];
  }
}

// Funkce pro formátování délky videa
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

// Funkce pro získání barevného gradientu podle tématu
function getThemeGradient(tags: string[]): string {
  if (tags.includes('vztahy') || tags.includes('láska') || tags.includes('partnerství')) {
    return 'bg-gradient-to-br from-pink-400 to-red-500';
  }
  if (tags.includes('sebepoznání') || tags.includes('osobní rozvoj') || tags.includes('self-help')) {
    return 'bg-gradient-to-br from-blue-400 to-indigo-500';
  }
  if (tags.includes('komunikace') || tags.includes('rozhovor') || tags.includes('dialog')) {
    return 'bg-gradient-to-br from-green-400 to-emerald-500';
  }
  if (tags.includes('stres') || tags.includes('úzkost') || tags.includes('anxiety')) {
    return 'bg-gradient-to-br from-orange-400 to-amber-500';
  }
  if (tags.includes('rodina') || tags.includes('děti') || tags.includes('rodičovství')) {
    return 'bg-gradient-to-br from-purple-400 to-violet-500';
  }
  if (tags.includes('práce') || tags.includes('kariéra') || tags.includes('zaměstnání')) {
    return 'bg-gradient-to-br from-teal-400 to-cyan-500';
  }
  
  // Výchozí gradient
  return 'bg-gradient-to-br from-neutral-400 to-neutral-500';
}



// Funkce pro formátování data
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, user, isInitialized } = useGlobalAuth();

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const blogPosts = await getBlogPosts();
      setPosts(blogPosts);
      setLoading(false);
    }
    loadPosts();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="container-custom py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Načítám minikurzy...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-custom py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Minikurzy</h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Minikurzy o vztazích, práci, financích a zdraví. Některé zdarma, některé za symbolickou cenu.
          </p>
        </div>

        {/* Blog Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any, index: number) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                prefetch={false}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group flex flex-col h-full"
              >
                {/* Video Thumbnail */}
                <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                  {post.thumbnailUrl ? (
                    // Zobrazí vlastní nahraný thumbnail
                    <Image
                      src={post.thumbnailUrl} 
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority={index < 6}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    // Fallback na barevný gradient s play buttonem
                    <div className={`w-full h-full flex items-center justify-center relative ${getThemeGradient(post.tags || [])}`}>
                      <div className="text-center text-white">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm">
                          <FiPlay className="w-8 h-8 ml-1" />
                        </div>
                        <h3 className="font-semibold text-lg px-4 leading-tight">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  )}
                  
                  {/* Duration Badge */}
                  {post.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
                      {formatDuration(post.duration)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    {post.subtitle && (
                      <p className="text-neutral-600 mb-3">
                        {post.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Meta informace a Tags - ukotvené na spodek */}
                  <div className="space-y-3">
                    {/* Meta informace */}
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      {post.duration && (
                        <span className="inline-flex items-center whitespace-nowrap flex-shrink-0 h-6">
                          <FiClock className="w-4 h-4 mr-1" />
                          {formatDuration(post.duration)}
                        </span>
                      )}
                      {post.views > 0 && (
                        <span className="inline-flex items-center whitespace-nowrap flex-shrink-0 h-6">
                          <FiEye className="w-4 h-4 mr-1" />
                          {post.views} shlédnutí
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {post.tags.map((tag: string) => (
                          <span 
                            key={tag}
                            className="px-2 bg-primary-100 text-primary-700 text-xs rounded-full whitespace-nowrap flex-shrink-0 inline-flex items-center h-6"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tlačítko s cenou - úplně na spodku */}
                    <div className="pt-2 border-t border-neutral-100">
                      {post.isPaid && post.price > 0 ? (
                        post.hasAccess ? (
                          <div className="w-full px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
                            ✓ Zakoupeno za {post.price} Kč
                          </div>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Kontrola přihlášení
                              if (!isAuthenticated || !user) {
                                router.push('/auth/login');
                                return;
                              }
                              
                              try {
                                const response = await fetch('/api/blog/purchase', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    blogPostId: post.id,
                                    blogPostSlug: post.slug,
                                  }),
                                });

                                const data = await response.json();

                                if (data.success && data.url) {
                                  // Přesměrovat na Stripe Checkout
                                  window.location.href = data.url;
                                } else {
                                  alert(data.error || 'Nepodařilo se spustit platbu. Zkuste to prosím později.');
                                }
                              } catch (error) {
                                console.error('Chyba při nákupu minikurzu:', error);
                                alert('Nepodařilo se spustit platbu. Zkuste to prosím později.');
                              }
                            }}
                            className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Koupit za {post.price} Kč
                          </button>
                        )
                      ) : (
                        <div className="w-full px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
                          🆓 Zdarma
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPlay className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Zatím žádná videa</h3>
            <p className="text-neutral-600">Brzy zde přidáme nová videa!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}