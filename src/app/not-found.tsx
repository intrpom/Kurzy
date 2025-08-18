import Link from 'next/link';
import MainLayout from './MainLayout';
import { FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-16">
        <div className="container-custom max-w-lg text-center">
          <h1 className="text-6xl font-serif font-bold text-primary-600 mb-6">404</h1>
          <h2 className="text-3xl font-serif font-bold mb-4">Stránka nenalezena</h2>
          <p className="text-lg text-neutral-700 mb-8">
            Omlouváme se, ale stránka, kterou hledáte, neexistuje nebo byla přesunuta.
          </p>
          <Link href="/" className="btn-primary inline-flex items-center">
            <FiArrowLeft className="mr-2" /> Zpět na domovskou stránku
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
