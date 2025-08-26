import { PrismaClient } from '@prisma/client';

/**
 * Konfigurace Prisma klienta pro serverless prostředí (Vercel)
 * - Používá Prisma Accelerate pro connection pooling v produkčním prostředí
 * - Omezuje počet připojení k databázi
 * - Řeší problém "Too many connections" v serverless prostředí
 */

// Nastavení klienta s různými parametry podle prostředí
const prismaClientSingleton = () => {
  try {
    // V produkčním prostředí VŽDY použijeme PRISMA_DATABASE_URL pro Prisma Accelerate
    // V ostatních prostředích můžeme použít standardní DATABASE_URL
    let databaseUrl;
    
    if (process.env.NODE_ENV === 'production') {
      // V produkci prioritně použijeme PRISMA_DATABASE_URL
      databaseUrl = process.env.PRISMA_DATABASE_URL;
      console.log('Používám PRISMA_DATABASE_URL pro produkční prostředí');
      
      // Kontrola, zda URL začíná správným protokolem pro Prisma Accelerate
      if (databaseUrl && !databaseUrl.startsWith('prisma://') && !databaseUrl.startsWith('prisma+postgres://')) {
        console.error('VAROVÁNÍ: PRISMA_DATABASE_URL nemá správný formát pro Prisma Accelerate');
        console.error('URL musí začínat protokolem prisma:// nebo prisma+postgres://');
      }
    } else {
      // V development prostředí můžeme použít standardní DATABASE_URL
      databaseUrl = process.env.DATABASE_URL;
      console.log('Používám DATABASE_URL pro vývojové prostředí');
    }
    
    // Pokud není nastavena žádná URL, použijeme záložní možnost
    if (!databaseUrl) {
      console.warn('Žádná databázová URL není nastavena, zkouším záložní možnosti');
      databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
    }
    
    // Minimální logování v produkci pro rychlejší pripojení
    if (!databaseUrl) {
      console.error('KRITICKÁ CHYBA: Žádná databázová URL není k dispozici!');
    }
    
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'production' 
        ? ['error'] // Minimální logování v produkci
        : ['error', 'warn'],
    });
  } catch (error) {
    console.error('Chyba při inicializaci Prisma klienta:', error);
    throw error;
  }
};

// Použití globální proměnné pro zabránění vytváření více instancí během hot-reloadu
const globalForPrisma = global as unknown as { prisma: ReturnType<typeof prismaClientSingleton> };

// Vytvoříme jednu instanci Prisma klienta pro celou aplikaci
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// V development prostředí ukládáme instanci do globálního objektu
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// V produkčním prostředí se vyhneme testování připojení při každém nahrání modulu
// Toto testování by vytvářelo zbytečná připojení v serverless prostředí
if (process.env.NODE_ENV !== 'production') {
  prisma.$connect()
    .then(() => {
      console.log('Úspěšně připojeno k databázi');
    })
    .catch((e) => {
      console.error('Chyba při připojení k databázi:', e);
    });
}

export default prisma;
