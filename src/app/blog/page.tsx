import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiPlay, FiCalendar, FiClock, FiEye } from 'react-icons/fi';



// Funkce pro získání blog postů
async function getBlogPosts() {
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
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API není dostupné, vrácím prázdný seznam:', error);
    // Fallback na prázdný seznam místo crashe
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
                {/* Video Thumbnail */}
                <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                  {post.thumbnailUrl ? (
                    // Zobrazí vlastní nahraný thumbnail
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover"
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