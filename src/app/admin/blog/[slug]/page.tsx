'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
// AdminLayout je poskytován automaticky přes layout.tsx
import BlogVideoInput from '@/components/BlogVideoInput';
import ImageUploader from '@/components/ImageUploader';
import { BlogPost } from '@/types/blog';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

interface FormData {
  title: string;
  subtitle: string;
  content: string;
  slug: string;
  videoUrl: string;
  videoLibraryId: string;
  thumbnailUrl: string;
  tags: string[];
  duration: number;
  isPublished: boolean;
}

export default function EditBlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    content: '',
    slug: '',
    videoUrl: '',
    videoLibraryId: '',
    thumbnailUrl: '',
    tags: [],
    duration: 0,
    isPublished: true,
  });

  // Načtení existujícího blog postu
  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/blog/${params.slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Nepodařilo se načíst blog post');
        }
        
        const blogPost: BlogPost = await response.json();
        setPost(blogPost);
        
        // Naplnění formuláře
        setFormData({
          title: blogPost.title,
          subtitle: blogPost.subtitle || '',
          content: blogPost.content || '',
          slug: blogPost.slug,
          videoUrl: blogPost.videoUrl || '',
          videoLibraryId: blogPost.videoLibraryId || '',
          thumbnailUrl: blogPost.thumbnailUrl || '',
          tags: blogPost.tags,
          duration: blogPost.duration || 0,
          isPublished: blogPost.isPublished,
        });
        
        // Nastavení tags inputu
        setTagsInput(blogPost.tags.join(', '));
      } catch (error) {
        console.error('Chyba při načítání blog postu:', error);
      } finally {
        setLoadingPost(false);
      }
    }

    fetchPost();
  }, [params.slug]);

  // Automatické generování slug z názvu
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[áäà]/g, 'a')
      .replace(/[éě]/g, 'e')
      .replace(/[íî]/g, 'i')
      .replace(/[óö]/g, 'o')
      .replace(/[úůü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[čç]/g, 'c')
      .replace(/[ď]/g, 'd')
      .replace(/[ň]/g, 'n')
      .replace(/[ř]/g, 'r')
      .replace(/[š]/g, 's')
      .replace(/[ť]/g, 't')
      .replace(/[ž]/g, 'z')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Zpracování změny tagů - pouze aktualizujeme input
  const handleTagsInputChange = (value: string) => {
    setTagsInput(value);
  };

  // Parsování tagů při blur nebo odeslání
  const parseTagsFromInput = (value: string) => {
    return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const handleTagsBlur = () => {
    const tags = parseTagsFromInput(tagsInput);
    setFormData(prev => ({ ...prev, tags }));
  };

  // Zpracování video dat
  const handleVideoChange = (videoData: { videoUrl: string; videoLibraryId: string; thumbnailUrl?: string }) => {
    setFormData(prev => ({
      ...prev,
      videoUrl: videoData.videoUrl,
      videoLibraryId: videoData.videoLibraryId,
      thumbnailUrl: videoData.thumbnailUrl || prev.thumbnailUrl,
    }));
  };

  const handleThumbnailUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: url
    }));
  };

  // Odeslání formuláře
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Parsujeme tagy před odesláním
    const finalTags = parseTagsFromInput(tagsInput);
    const finalFormData = { ...formData, tags: finalTags };

    try {
      const response = await fetch(`/api/blog/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se aktualizovat blog post');
      }

      // Přesměrování zpět na seznam
      router.push('/admin/blog');
    } catch (error) {
      console.error('Chyba při aktualizaci blog postu:', error);
      alert('Nepodařilo se aktualizovat blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="space-y-4 text-center">
          <p className="text-red-600">Blog post se nepodařilo načíst</p>
          <p className="text-neutral-600">Slug: {params.slug}</p>
          <Link href="/admin/blog" className="text-primary-600 hover:underline">
            ← Zpět na seznam
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/blog"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-neutral-900">
                Editovat video
              </h1>
              <p className="text-neutral-600 mt-1">
                Úprava blog postu: {post.title}
              </p>
            </div>
          </div>
          <Link 
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Zobrazit na webu
          </Link>
        </div>

        {/* Formulář */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Základní informace</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Název */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                  Název videa *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Podtitul */}
              <div className="md:col-span-2">
                <label htmlFor="subtitle" className="block text-sm font-medium text-neutral-700 mb-2">
                  Podtitul
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 mb-2">
                  URL slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  URL bude: /blog/{formData.slug}
                </p>
              </div>

              {/* Délka videa */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-neutral-700 mb-2">
                  Délka videa (minuty)
                </label>
                <input
                  type="number"
                  id="duration"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  onFocus={(e) => {
                    if (formData.duration === 0) {
                      e.target.select();
                    }
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>

              {/* Tagy */}
              <div className="md:col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 mb-2">
                  Tagy
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => handleTagsInputChange(e.target.value)}
                  onBlur={handleTagsBlur}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="osobní rozvoj, stres, produktivita"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Odděluj tagy čárkami
                </p>
              </div>
            </div>
          </div>

          {/* Video */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Video</h2>
            <BlogVideoInput
              onVideoChange={handleVideoChange}
              initialVideoUrl={formData.videoUrl}
              initialLibraryId={formData.videoLibraryId || '276140'}
            />
            
                    {/* Thumbnail obrázek - Upload nebo URL */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Thumbnail obrázek
          </label>
          
          {/* Upload možnost */}
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">📤 Nahrát vlastní obrázek:</p>
            <ImageUploader
              currentImageUrl={formData.thumbnailUrl}
              onImageUpload={handleThumbnailUpload}
              folder="blog-thumbnails"
            />
          </div>
          
          {/* Nebo URL */}
          <div className="border-t pt-4">
            <p className="text-sm text-neutral-600 mb-2">🔗 Nebo použít URL:</p>
            <input
              type="text"
              id="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/thumbnail.jpg nebo /images/blog/nazev.jpg"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Pokud je prázdné, použije se automatický gradient podle tagů.
            </p>
          </div>
        </div>
          </div>

          {/* Obsah */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Popis videa</h2>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Podrobný popis videa, o čem se bavíš, co se diváci naučí..."
            />
          </div>

          {/* Nastavení */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Nastavení</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-neutral-900">
                Publikováno na webu
              </label>
            </div>
          </div>

          {/* Statistiky */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Statistiky</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Zobrazení</p>
                <p className="text-2xl font-semibold text-neutral-900">{post.views.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Publikováno</p>
                <p className="text-sm text-neutral-900">{new Date(post.publishedAt).toLocaleDateString('cs-CZ')}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Vytvořeno</p>
                <p className="text-sm text-neutral-900">{new Date(post.createdAt).toLocaleDateString('cs-CZ')}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Aktualizováno</p>
                <p className="text-sm text-neutral-900">{new Date(post.updatedAt).toLocaleDateString('cs-CZ')}</p>
              </div>
            </div>
          </div>

          {/* Akce */}
          <div className="flex items-center justify-end space-x-4 bg-white rounded-lg shadow-sm p-6">
            <Link 
              href="/admin/blog"
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Zrušit
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.slug}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Ukládání...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Uložit změny
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
}
