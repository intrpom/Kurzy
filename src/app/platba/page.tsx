'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiArrowLeft, FiCreditCard, FiLock } from 'react-icons/fi';

export default function PaymentPage({
  searchParams
}: {
  searchParams: { courseId?: string }
}) {
  const router = useRouter();
  const courseId = searchParams.courseId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simulovaná data kurzu
  const course = {
    id: courseId || 'unknown',
    title: courseId === 'sebepoznani-a-rozvoj' ? 'Sebepoznání a rozvoj' : 
           courseId === 'zvladani-stresu' ? 'Zvládání stresu' : 
           courseId === 'komunikacni-dovednosti' ? 'Komunikační dovednosti' : 
           courseId === 'mindfulness-v-praxi' ? 'Mindfulness v praxi' : 
           'Kurz',
    price: 990
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulace zpracování platby
    setTimeout(() => {
      // Přesměrování na stránku s informací o budoucím spuštění plateb
      router.push(`/platba/potvrzeni?courseId=${courseId}`);
    }, 1500);
  };
  
  return (
    <MainLayout>
      <section className="py-12 bg-neutral-50">
        <div className="container-custom max-w-4xl">
          <div className="mb-6">
            <Link href={`/kurzy/${courseId}`} className="text-neutral-600 hover:text-primary-600 inline-flex items-center">
              <FiArrowLeft className="mr-2" /> Zpět na detail kurzu
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-primary-600 text-white">
              <h1 className="text-2xl font-bold">Objednávka kurzu</h1>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="text-xl font-medium mb-6">Platební údaje</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
                          Jméno
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
                          Příjmení
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-neutral-200">
                      <div className="flex items-center mb-4">
                        <FiCreditCard className="text-primary-600 mr-2" />
                        <h3 className="text-lg font-medium">Platební karta</h3>
                      </div>
                      
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-700 mb-1">
                          Číslo karty
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label htmlFor="expiry" className="block text-sm font-medium text-neutral-700 mb-1">
                            Platnost (MM/RR)
                          </label>
                          <input
                            type="text"
                            id="expiry"
                            className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            placeholder="MM/RR"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="cvc" className="block text-sm font-medium text-neutral-700 mb-1">
                            CVC kód
                          </label>
                          <input
                            type="text"
                            id="cvc"
                            className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="terms"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            required
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="terms" className="text-neutral-700">
                            Souhlasím s <a href="#" className="text-primary-600 hover:text-primary-700">obchodními podmínkami</a> a <a href="#" className="text-primary-600 hover:text-primary-700">zásadami ochrany soukromí</a>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full btn-primary flex justify-center items-center"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Zpracování...' : 'Dokončit objednávku'}
                      </button>
                      
                      <div className="flex items-center justify-center mt-4 text-sm text-neutral-600">
                        <FiLock className="mr-1" />
                        <span>Zabezpečená platba</span>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="bg-neutral-50 p-6 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Shrnutí objednávky</h3>
                  
                  <div className="mb-4 pb-4 border-b border-neutral-200">
                    <p className="font-medium">{course.title}</p>
                    <p className="text-neutral-600">Online kurz</p>
                  </div>
                  
                  <div className="space-y-2 mb-4 pb-4 border-b border-neutral-200">
                    <div className="flex justify-between">
                      <span>Cena kurzu</span>
                      <span>{course.price} Kč</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DPH (21%)</span>
                      <span>{Math.round(course.price * 0.21)} Kč</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between font-bold">
                    <span>Celkem</span>
                    <span>{course.price} Kč</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
