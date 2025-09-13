'use client';

import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import MainLayout from '@/app/MainLayout';
import BunnyVideoPlayer from '@/components/BunnyVideoPlayer';
import { BlogPost } from '@/types/blog';
import { FiPlay } from 'react-icons/fi';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { useState, useEffect } from 'react';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

// Client komponenta - revalidace se nepoužívá

// Client-side funkce pro získání blog postu přes API
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/api/blog/${slug}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Nepodařilo se načíst blog post');
    }
    return await response.json();
  } catch (error) {
    console.error('Chyba při načítání blog postu:', error);
    return null;
  }
}

// Zjednodušená funkce - nebudeme zatím načítat související posty
// pro rychlejší načítání stránky
async function getRelatedPosts(currentSlug: string, tags: string[]): Promise<BlogPost[]> {
  // Rychle vrátíme prázdný seznam - eliminujeme pomalé API volání
  return [];
}

// Funkce pro formátování délky videa
function formatDuration(minutes?: number): string {
  if (!minutes) return '';
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

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, user, isInitialized } = useGlobalAuth();

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      const blogPost = await getBlogPost(params.slug);
      setPost(blogPost);
      setLoading(false);
      
      if (!blogPost) {
        notFound();
      }
    }
    loadPost();
  }, [params.slug]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container-custom py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Načítám minikurz...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    notFound();
  }

  // Prozatím nebudeme načítat související posty pro rychlejší loading
  const relatedPosts: BlogPost[] = [];

  return (
    <MainLayout>
      <div className="container-custom py-8">
        {/* Zpět na blog */}
        <Link 
          href="/blog"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zpět na blog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hlavní obsah */}
          <div className="lg:col-span-2">
            {/* Video přehrávač */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {post.videoUrl && post.videoLibraryId ? (
                <ProtectedVideoPlayer
                  videoId={post.videoUrl}
                  libraryId={post.videoLibraryId}
                  title={post.title}
                  className="w-full aspect-video"
                  isPaid={post.isPaid}
                  price={post.price}
                  hasAccess={post.hasAccess}
                  onPurchase={async () => {
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
                />
              ) : (
                <div className="w-full aspect-video bg-neutral-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <p className="text-neutral-500">Video není k dispozici</p>
                  </div>
                </div>
              )}
            </div>

            {/* Informace o videu */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-3">
                {post.title}
              </h1>
              
              {post.subtitle && (
                <p className="text-lg text-neutral-600 mb-4">
                  {post.subtitle}
                </p>
              )}

              {/* Meta informace */}
              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
                <span>{new Date(post.publishedAt).toLocaleDateString('cs-CZ')}</span>
                {post.duration && <span>• {formatDuration(post.duration)}</span>}
                <span>• {formatViews(post.views)} shlédnutí</span>
              </div>

              {/* Cenové informace a nákup */}
              <div className="border border-neutral-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {post.isPaid ? 'Placený minikurz' : 'Minikurz zdarma'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {post.isPaid ? (
                        <span className="text-2xl font-bold text-primary-600">
                          {post.price} Kč
                        </span>
                      ) : (
                        <span className="text-lg font-semibold text-green-600">
                          🆓 Zdarma
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {post.isPaid ? (
                    post.hasAccess ? (
                      <div className="text-center">
                        <div className="text-green-600 font-semibold mb-1">✓ Minikurz zakoupen</div>
                        <div className="text-xs text-neutral-500">Můžete sledovat ihned</div>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
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
                        className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Koupit minikurz
                      </button>
                    )
                  ) : (
                    <div className="text-center">
                      <div className="text-green-600 font-semibold mb-1">✓ Přístup zdarma</div>
                      <div className="text-xs text-neutral-500">Můžete sledovat ihned</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tagy */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="inline-block bg-primary-50 text-primary-700 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Popis */}
              {post.content && (
                <div className="prose prose-neutral max-w-none">
                  {post.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar se souvisejícími videi */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Související videa</h3>
              
              {relatedPosts.length > 0 ? (
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link 
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {/* Video Preview */}
                        <div className="w-20 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                          {relatedPost.thumbnailUrl ? (
                            <img 
                              src={relatedPost.thumbnailUrl} 
                              alt={relatedPost.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${getThemeGradient(relatedPost.tags || [])}`}>
                              <FiPlay className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                            <span>{formatViews(relatedPost.views)} shlédnutí</span>
                            {relatedPost.duration && (
                              <>
                                <span>•</span>
                                <span>{formatDuration(relatedPost.duration)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">Žádná související videa</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
