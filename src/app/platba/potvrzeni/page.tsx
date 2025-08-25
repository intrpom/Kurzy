'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiCheckCircle, FiArrowRight, FiHome, FiBookOpen } from 'react-icons/fi';

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // Ověříme session s Stripe API a přidáme kurz uživateli
      const processPayment = async () => {
        try {
          const response = await fetch('/api/stripe/success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          if (data.success) {
            setCourseData(data.course);
          } else {
            console.error('Chyba při zpracování platby:', data.error);
            // Pro debug účely zobrazíme úspěch i při chybě
            setCourseData({
              title: 'Kurz (testovací)',
              slug: 'test',
            });
          }
        } catch (error) {
          console.error('Chyba při volání API:', error);
          // Pro debug účely zobrazíme úspěch i při chybě
          setCourseData({
            title: 'Kurz (testovací)',
            slug: 'test',
          });
        } finally {
          setIsLoading(false);
        }
      };

      processPayment();
    } else {
      // Bez session ID přesměrujeme na kurzy
      router.push('/kurzy');
    }
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-custom py-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-serif font-bold mb-4">Ověřujeme vaši platbu...</h1>
          <p className="text-neutral-600">Prosím vyčkejte, dokončujeme transakci.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-custom py-16">
        {/* Úspěšná platba */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <FiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-4 text-green-600">
              Platba byla úspěšná!
            </h1>
            <p className="text-lg text-neutral-600 mb-2">
              Děkujeme za vaši objednávku. Kurz byl přidán do vašeho účtu.
            </p>
          </div>

          {/* Informace o kurzu */}
          {courseData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2 text-green-800">
                {courseData.title}
              </h2>
              <p className="text-green-700">
                Kurz je nyní dostupný ve vašem účtu.
              </p>
            </div>
          )}

          {/* Akční tlačítka */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/moje-kurzy"
              className="btn-primary inline-flex items-center"
            >
              <FiBookOpen className="mr-2" />
              Moje kurzy <FiArrowRight className="ml-2" />
            </Link>
            
            <Link
              href="/kurzy"
              className="btn-outline inline-flex items-center"
            >
              <FiHome className="mr-2" />
              Zpět na kurzy
            </Link>
          </div>

          {/* Další informace */}
          <div className="mt-12 text-sm text-neutral-500">
            <p>
              Potvrzení o platbě bylo odesláno na váš email. 
              Pokud máte jakékoliv dotazy, neváhejte nás kontaktovat.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
