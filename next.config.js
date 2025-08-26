/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'placehold.co', 'images.unsplash.com', 'mgrwh3ai8np2mvyu.public.blob.vercel-storage.com'],
  },
  // Konfigurace pro potlačení varování o dynamických API trasách
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'kurzy-three.vercel.app', 'onlinekurzy.ales-kalina.cz'],
    },
  },
  // Potlačení varování o dynamických API trasách
  onDemandEntries: {
    // Toto je pouze pro vývoj, ale pomáhá s potlačením varování
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  // Ignorování varování při buildu
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorování TypeScript chyb při buildu
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
