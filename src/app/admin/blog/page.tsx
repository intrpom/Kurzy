import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { FiPlus, FiEdit, FiTrash, FiEye, FiEyeOff, FiVideo } from 'react-icons/fi';
import prisma from '@/lib/db';

// Server funkce pro načítání blog postů pro admin
async function getAdminBlogPosts(): Promise<BlogPost[]> {
  try {
    console.log('📝 Načítám blog posty pro admin...');
    
    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Konverze Date objektů na string pro kompatibilitu s BlogPost interface
    const convertedPosts: BlogPost[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle ?? undefined,
      content: post.content ?? undefined,
      excerpt: post.excerpt,
      slug: post.slug,
      isPublished: post.isPublished,
      videoUrl: post.videoUrl ?? undefined,
      videoLibraryId: post.videoLibraryId ?? undefined,
      thumbnailUrl: post.thumbnailUrl ?? undefined,
      publishedAt: post.publishedAt?.toISOString() ?? undefined,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }));

    console.log(`✅ Načteno ${convertedPosts.length} blog postů pro admin`);
    return convertedPosts;
  } catch (error) {
    console.error('Chyba při načítání blog postů:', error);
    return [];
  }
}

// Import Client komponenty
import AdminBlogClient from './AdminBlogClient';

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

/**
 * Server komponenta pro správu blog postů
 */
export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  
  return <AdminBlogClient initialPosts={posts} />;
}