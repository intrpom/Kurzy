import { Suspense } from 'react';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import { FiArrowLeft } from 'react-icons/fi';

export default function Login({
  searchParams
}: {
  searchParams: { courseId?: string, slug?: string, price?: string, action?: string, returnUrl?: string }
}) {
  const courseId = searchParams.courseId;
  const slug = searchParams.slug;
  const price = searchParams.price;
  const action = searchParams.action;
  const returnUrl = searchParams.returnUrl;
  
  return (
    <MainLayout>
      <section className="py-16 bg-neutral-50 min-h-[70vh] flex items-center">
        <div className="container-custom max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-serif font-bold mb-6 text-center">Přihlášení</h1>
            
            <div className="text-neutral-700 mb-6 text-center space-y-3">
              {action === 'purchase' ? (
                <>
                  <p className="font-medium">Pro nákup kurzu za {price} Kč je potřeba se nejprve přihlásit.</p>
                  <p className="text-sm">Zadejte své jméno a e-mail - zašleme vám přihlašovací odkaz.</p>
                </>
              ) : returnUrl ? (
                <>
                  <p className="font-medium">Pro sledování tohoto videa je potřeba se nejprve přihlásit.</p>
                  <p className="text-sm">Zadejte své jméno a e-mail - zašleme vám přihlašovací odkaz.</p>
                </>
              ) : (
                <>
                  <p className="font-medium">Vítejte! Pro přístup ke kurzům se nejprve přihlaste.</p>
                  <p className="text-sm">Zadejte své jméno a e-mail - zašleme vám přihlašovací odkaz.</p>
                </>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">💡 Jak to funguje:</p>
                <p className="text-blue-700">
                  <strong>Noví návštěvníci:</strong> Vytvoříme vám účet automaticky<br/>
                  <strong>Vracející se uživatelé:</strong> Přihlásíme vás do existujícího účtu
                </p>
              </div>
            </div>
            
            <Suspense fallback={<div>Načítání...</div>}>
              <LoginForm courseId={courseId} slug={slug} price={price} action={action} returnUrl={returnUrl} />
            </Suspense>
            
            <div className="mt-8 text-center">
              <Link 
                href={returnUrl ? decodeURIComponent(returnUrl) : (slug ? `/kurzy/${slug}` : '/')} 
                className="text-neutral-600 hover:text-primary-600 inline-flex items-center"
              >
                <FiArrowLeft className="mr-2" /> Zpět
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
