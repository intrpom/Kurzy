import { Suspense } from 'react';
import MainLayout from '@/app/MainLayout';
import VerifyAuth from '@/components/auth/VerifyAuth';

export default function VerifyPage({
  searchParams
}: {
  searchParams: { token?: string; courseId?: string; email?: string; slug?: string }
}) {
  const { token, courseId, email, slug } = searchParams;
  
  return (
    <MainLayout>
      <section className="py-16 bg-neutral-50 min-h-[70vh] flex items-center">
        <div className="container-custom max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-serif font-bold mb-6 text-center">Ověření přihlášení</h1>
            
            <Suspense fallback={<div className="text-center py-4">Načítání...</div>}>
              {token && email ? (
                <VerifyAuth 
                  token={token} 
                  email={email} 
                  courseId={courseId} 
                  slug={slug}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-600">Chybí potřebné parametry pro ověření.</p>
                  <p className="mt-4">
                    <a href="/auth/login" className="text-primary-600 hover:text-primary-800 underline">
                      Zpět na přihlášení
                    </a>
                  </p>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
