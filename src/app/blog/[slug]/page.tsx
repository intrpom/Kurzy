import Link from 'next/link';
import { notFound } from 'next/navigation';
import MainLayout from '@/app/MainLayout';
import BunnyVideoPlayer from '@/components/BunnyVideoPlayer';
import { BlogPost } from '@/types/blog';



// Funkce pro načítání jednoho blog postu
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Použijeme plnou URL i na serveru pro Next.js Server Components
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
      cache: 'no-store', // Pro aktuální počet zobrazení
      headers: {
        'User-Agent': 'kurzy-internal-fetch'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Nepodařilo se načíst blog post');
    }
    
    return response.json();
  } catch (error) {
    console.error('Chyba při načítání blog postu:', error);
    return null;
  }
}

// Funkce pro načítání souvisejících videí
async function getRelatedPosts(currentSlug: string, tags: string[]): Promise<BlogPost[]> {
  try {
    // Použijeme plnou URL i na serveru pro Next.js Server Components
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/blog`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'kurzy-internal-fetch'
      }
    });
    
    if (!response.ok) return [];
    
    const posts: BlogPost[] = await response.json();
    
    // Filtruj současný post a vrať jen 3 související
    return posts
      .filter(post => post.slug !== currentSlug)
      .filter(post => tags.some(tag => post.tags.includes(tag)))
      .slice(0, 3);
  } catch (error) {
    console.error('Chyba při načítání souvisejících postů:', error);
    return [];
  }
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.tags);

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
                <BunnyVideoPlayer
                  videoId={post.videoUrl}
                  libraryId={post.videoLibraryId}
                  className="w-full aspect-video"
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
                        {/* Thumbnail */}
                        <div className="w-20 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                          {relatedPost.thumbnailUrl ? (
                            <img 
                              src={relatedPost.thumbnailUrl}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
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
