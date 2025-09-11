import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// Funkce checkBlogPostAccess byla odstraněna - nahrazena přímými dotazy v API endpointech pro lepší výkon

/**
 * Přidá přístup uživatele k blog postu (po zaplacení)
 * @param userId - ID uživatele
 * @param blogPostId - ID blog postu
 * @returns Promise<boolean> - true pokud se podařilo přidat přístup
 */
export async function grantBlogPostAccess(
  userId: string, 
  blogPostId: string,
  price?: number,
  stripePaymentId?: string
): Promise<boolean> {
  try {
    // Získáme informace o blog postu pro cenu
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { price: true }
    });

    await prisma.userMiniCourse.upsert({
      where: {
        userId_blogPostId: {
          userId,
          blogPostId
        }
      },
      update: {
        // Pokud už existuje, neměníme nic
      },
      create: {
        userId,
        blogPostId,
        price: price || blogPost?.price || 0,
        stripePaymentId
      }
    });
    return true;
  } catch (error) {
    // Pokud už přístup existuje, není to chyba
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return true;
    }
    console.error('Chyba při přidávání přístupu k minikurzu:', error);
    return false;
  }
}

/**
 * Získá seznam blog postů s informací o přístupu pro daného uživatele
 * @param userId - ID uživatele (volitelné)
 * @returns Promise<BlogPost[]> - seznam blog postů s přístupovými informacemi
 */
export async function getBlogPostsWithAccess(userId?: string) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
    
    if (!userId) {
      // Pro nepřihlášené uživatele označit všechny placené jako bez přístupu
      return posts.map(post => ({
        ...post,
        hasAccess: !post.isPaid || post.price === 0,
        publishedAt: post.publishedAt.toISOString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      }));
    }
    
    // Pro přihlášené uživatele zkontrolovat přístup
    const userMiniCourses = await prisma.userMiniCourse.findMany({
      where: { userId },
      select: { blogPostId: true }
    });
    
    const accessiblePostIds = new Set(userMiniCourses.map(umc => umc.blogPostId));
    
    return posts.map(post => ({
      ...post,
      hasAccess: !post.isPaid || post.price === 0 || accessiblePostIds.has(post.id),
      publishedAt: post.publishedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Chyba při načítání blog postů s přístupem:', error);
    return [];
  }
}
