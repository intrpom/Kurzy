import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiPlay, FiCalendar, FiClock, FiEye } from 'react-icons/fi';

// Funkce pro získání blog postů
async function getBlogPosts() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/blog`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Chyba při načítání blog postů:', error);
    throw new Error('Nepodařilo se načíst blog posty');
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

// Funkce pro formátování data
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <MainLayout>
      <div className="container-custom py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Video Blog</h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Zdarma videa o vztazích, psychologii a osobním rozvoji
          </p>
        </div>

        {/* Blog Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
              >
                {/* Video Thumbnail - použijeme iframe od Bunny.net */}
                <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                  {post.videoUrl && post.videoLibraryId ? (
                    <>
                      <iframe
                        src={`https://iframe.mediadelivery.net/embed/${post.videoLibraryId}/${post.videoUrl}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                        className="w-full h-full border-0 pointer-events-none"
                        loading="lazy"
                        title={post.title}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
                        <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                          <FiPlay className="w-6 h-6 text-primary-600 ml-1" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <FiPlay className="w-6 h-6 text-white" />
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
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  {post.subtitle && (
                    <p className="text-neutral-600 mb-3">
                      {post.subtitle}
                    </p>
                  )}

                  {/* Meta informace */}
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(post.publishedAt)}
                      </span>
                      {post.duration && (
                        <span className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1" />
                          {formatDuration(post.duration)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center">
                      <FiEye className="w-4 h-4 mr-1" />
                      {post.views}
                    </span>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag: string) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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