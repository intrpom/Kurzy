import { Suspense } from 'react';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { grantBlogPostAccess } from '@/lib/blog-access';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

interface PageProps {
  searchParams: {
    session_id?: string;
    blog_post_id?: string;
  };
}

async function processSuccessfulPurchase(sessionId: string, blogPostId: string) {
  try {
    // Získání session uživatele
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      throw new Error('Uživatel není přihlášen');
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const userId = sessionData?.id;

    if (!userId) {
      throw new Error('Neplatná session');
    }

    // Získání informací o blog postu
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { id: true, slug: true, title: true, price: true }
    });

    if (!blogPost) {
      throw new Error('Blog post nebyl nalezen');
    }

    // Přidání přístupu uživateli
    const success = await grantBlogPostAccess(userId, blogPostId);
    
    if (!success) {
      throw new Error('Nepodařilo se přidat přístup');
    }

    return {
      success: true,
      blogPost
    };
  } catch (error) {
    console.error('Chyba při zpracování nákupu blog postu:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba'
    };
  }
}

export default async function BlogPurchaseSuccessPage({ searchParams }: PageProps) {
  const { session_id, blog_post_id } = searchParams;

  if (!session_id || !blog_post_id) {
    return (
      <MainLayout>
        <div className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Chyba při zpracování</h1>
            <p className="text-neutral-600 mb-6">Chybí potřebné parametry pro dokončení nákupu.</p>
            <Link href="/blog" className="btn-primary">
              Zpět na sekci Minikurzy
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const result = await processSuccessfulPurchase(session_id, blog_post_id);

  return (
    <MainLayout>
      <div className="container-custom py-16">
        <div className="max-w-md mx-auto text-center">
          {result.success && result.blogPost ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">Nákup dokončen!</h1>
              <p className="text-neutral-600 mb-6">
                Úspěšně jste si zakoupili minikurz <strong>{result.blogPost.title}</strong>.
              </p>
              <div className="space-y-3">
                <Link 
                  href={`/blog/${result.blogPost.slug}`}
                  className="btn-primary w-full inline-flex items-center justify-center"
                >
                  Podívat se na minikurz <FiArrowRight className="ml-2" />
                </Link>
                <Link 
                  href="/blog"
                  className="btn-secondary w-full inline-flex items-center justify-center"
                >
                  Zpět na sekci Minikurzy
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">Chyba při zpracování</h1>
              <p className="text-neutral-600 mb-6">
                {result.error || 'Nepodařilo se dokončit nákup. Kontaktujte prosím podporu.'}
              </p>
              <Link href="/blog" className="btn-primary">
                Zpět na sekci Minikurzy
              </Link>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
