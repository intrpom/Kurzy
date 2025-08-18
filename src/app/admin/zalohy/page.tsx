import dynamic from 'next/dynamic';

// Použití dynamického importu pro client-side rendering
// Použijeme absolutní cestu pro lepší kompatibilitu s Vercel
const BackupPageClient = dynamic(() => import('@/components/admin/BackupPageClient'), {
  ssr: false, // Zakázání server-side renderování
  loading: () => <div className="p-8">Načítání...</div>
});

export default function BackupPage() {
  return <BackupPageClient />;
}
