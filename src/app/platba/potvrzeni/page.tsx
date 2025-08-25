'use client';

import { Suspense } from 'react';
import MainLayout from '@/app/MainLayout';
import PaymentConfirmationContent from './PaymentConfirmationContent';

export default function PaymentConfirmationPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="container-custom py-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-serif font-bold mb-4">Načítám...</h1>
        </div>
      }>
        <PaymentConfirmationContent />
      </Suspense>
    </MainLayout>
  );
}
