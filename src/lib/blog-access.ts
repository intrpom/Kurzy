import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

/**
 * Kontrola přístupu uživatele k blog postu
 * @param blogPostId - ID blog postu
 * @param request - NextRequest objekt (volitelný, pro middleware)
 * @returns Promise<boolean> - true pokud má uživatel přístup
 */
export async function checkBlogPostAccess(
  blogPostId: string, 
  request?: NextRequest
): Promise<boolean> {
  try {
    // Získání session cookie
    let sessionCookie;
    if (request) {
      sessionCookie = request.cookies.get('session');
    } else {
      sessionCookie = cookies().get('session');
    }
    
    if (!sessionCookie || !sessionCookie.value) {
      return false; // Nepřihlášený uživatel nemá přístup
    }
    
    // Dekódování session
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      return false; // Neplatná session
    }
    
    if (!sessionData || !sessionData.id) {
      return false; // Neplatná session data
    }
    
    const userId = sessionData.id;
    
    // Získání informací o blog postu
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { isPaid: true, price: true }
    });
    
    if (!blogPost) {
      return false; // Blog post neexistuje
    }
    
    // Pokud není placený, má přístup každý přihlášený uživatel
    if (!blogPost.isPaid || blogPost.price === 0) {
      return true;
    }
    
    // Pro placené blog posty zkontrolovat přístup v UserBlogPost
    const userBlogPost = await prisma.userBlogPost.findFirst({
      where: {
        userId: userId,
        blogPostId: blogPostId
      }
    });
    
    return !!userBlogPost; // true pokud má přístup
  } catch (error) {
    console.error('Chyba při kontrole přístupu k blog postu:', error);
    return false;
  }
}

/**
 * Přidá přístup uživatele k blog postu (po zaplacení)
 * @param userId - ID uživatele
 * @param blogPostId - ID blog postu
 * @returns Promise<boolean> - true pokud se podařilo přidat přístup
 */
export async function grantBlogPostAccess(
  userId: string, 
  blogPostId: string
): Promise<boolean> {
  try {
    await prisma.userBlogPost.create({
      data: {
        userId,
        blogPostId
      }
    });
    return true;
  } catch (error) {
    // Pokud už přístup existuje, není to chyba
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return true;
    }
    console.error('Chyba při přidávání přístupu k blog postu:', error);
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
    const userBlogPosts = await prisma.userBlogPost.findMany({
      where: { userId },
      select: { blogPostId: true }
    });
    
    const accessiblePostIds = new Set(userBlogPosts.map(ubp => ubp.blogPostId));
    
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
