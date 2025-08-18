import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';

// Vytvoření globální instance PrismaClient
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

// Deklarace globálního namespace pro TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Funkce pro získání správného databázového URL podle prostředí
function getDatabaseUrl() {
  if (process.env.NODE_ENV === 'production') {
    // V produkci používáme Prisma Accelerate
    if (process.env.PRISMA_DATABASE_URL) {
      logger.info('Používám PRISMA_DATABASE_URL pro produkční prostředí');
      return process.env.PRISMA_DATABASE_URL;
    } else {
      logger.warn('PRISMA_DATABASE_URL není nastaveno v produkčním prostředí!');
      return process.env.DATABASE_URL;
    }
  }
  
  // V development prostředí používáme standardní DATABASE_URL
  return process.env.DATABASE_URL;
}

// Vytvoření a export sdílené instance PrismaClient
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

// Uložení instance do globálního objektu v development módu
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
