import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-playfair-display',
  preload: true,
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
});

export const metadata: Metadata = {
  title: 'Aleš Kalina | Online Kurzy',
  description: 'Moderní online kurzy pro osobní rozvoj a psychologii',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Optimalizace pro Google Fonts */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
