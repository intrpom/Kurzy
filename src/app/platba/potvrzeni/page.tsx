import Link from 'next/link';
import MainLayout from '@/app/MainLayout';
import { FiMail, FiArrowRight } from 'react-icons/fi';

export default function PaymentConfirmationPage({
  searchParams
}: {
  searchParams: { courseId?: string }
}) {
  const courseId = searchParams.courseId;
  
  // Simulovaná data kurzu
  const course = {
    id: courseId || 'unknown',
    title: courseId === 'sebepoznani-a-rozvoj' ? 'Sebepoznání a rozvoj' : 
           courseId === 'zvladani-stresu' ? 'Zvládání stresu' : 
           courseId === 'komunikacni-dovednosti' ? 'Komunikační dovednosti' : 
           courseId === 'mindfulness-v-praxi' ? 'Mindfulness v praxi' : 
           'Kurz',
  };
  
  return (
    <MainLayout>
      <section className="py-16 bg-neutral-50 min-h-[70vh] flex items-center">
        <div className="container-custom max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiMail className="text-primary-600 text-2xl" />
            </div>
            
            <h1 className="text-3xl font-serif font-bold mb-4">Děkujeme za váš zájem!</h1>
            
            <p className="text-neutral-700 mb-6">
              Platby budou brzy spuštěny – sledujte prosím svůj e-mail pro další informace.
            </p>
            
            <div className="bg-neutral-50 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-2">Vybraný kurz:</h3>
              <p>{course.title}</p>
            </div>
            
            <p className="text-neutral-700 mb-6">
              Jakmile bude platební systém aktivní, budeme vás kontaktovat s instrukcemi, jak dokončit nákup kurzu.
            </p>
            
            <div className="space-y-4">
              <Link 
                href="/kurzy"
                className="btn-primary inline-flex items-center"
              >
                Prozkoumat další kurzy <FiArrowRight className="ml-2" />
              </Link>
              
              <div>
                <Link 
                  href="/"
                  className="text-neutral-600 hover:text-primary-600"
                >
                  Zpět na domovskou stránku
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
