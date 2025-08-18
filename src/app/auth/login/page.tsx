import { Suspense } from 'react';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import { FiArrowLeft } from 'react-icons/fi';

export default function Login({
  searchParams
}: {
  searchParams: { courseId?: string, slug?: string }
}) {
  const courseId = searchParams.courseId;
  const slug = searchParams.slug;
  
  return (
    <MainLayout>
      <section className="py-16 bg-neutral-50 min-h-[70vh] flex items-center">
        <div className="container-custom max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-serif font-bold mb-6 text-center">Přihlášení</h1>
            
            <p className="text-neutral-700 mb-6 text-center">
              Pro přístup ke kurzu zadejte svůj e-mail. Zašleme vám přihlašovací odkaz.
            </p>
            
            <Suspense fallback={<div>Načítání...</div>}>
              <LoginForm courseId={courseId} />
            </Suspense>
            
            <div className="mt-8 text-center">
              <Link href={slug ? `/kurzy/${slug}` : '/'} className="text-neutral-600 hover:text-primary-600 inline-flex items-center">
                <FiArrowLeft className="mr-2" /> Zpět
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
