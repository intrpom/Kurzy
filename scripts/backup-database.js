// Skript pro manuální zálohování produkční databáze na Vercel
// Použití: node backup-database.js [cílová_složka]
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Načtení proměnných prostředí z .env souboru
dotenv.config({ path: path.join(__dirname, '../.env') });

// Kontrola, zda je nastavena proměnná DATABASE_URL
if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
  console.error('Chyba: Není nastavena žádná databázová URL');
  process.exit(1);
}

// Jednoduchá podpora pro Prisma Accelerate
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

// Vytvoření instance Prisma klienta
const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('Zahajuji zálohování produkční databáze...');
    
    // Určení cílové složky pro zálohy
    let backupDir = path.join(__dirname, '../backups');
    if (process.argv.length > 2) {
      backupDir = process.argv[2];
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Vytvoření složky s časovým razítkem pro tuto zálohu
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(currentBackupDir);
    
    console.log('Připojuji se k databázi...');
    console.log(`Zálohuji do složky: ${currentBackupDir}`);
    
    // Záloha kurzů včetně modulů, lekcí a materiálů
    console.log('Načítám kurzy, moduly, lekce a materiály...');
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'courses.json'),
      JSON.stringify(courses, null, 2)
    );
    console.log(`✅ Zálohováno ${courses.length} kurzů`);
    
    // Záloha uživatelů (bez citlivých údajů)
    console.log('Načítám uživatele...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Zálohováno ${users.length} uživatelů`);
    
    // Záloha přístupů uživatelů ke kurzům
    console.log('Načítám přístupy ke kurzům...');
    const userCourses = await prisma.userCourse.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'user-courses.json'),
      JSON.stringify(userCourses, null, 2)
    );
    console.log(`✅ Zálohováno ${userCourses.length} přístupů ke kurzům`);
    
    // Vytvoření souboru s metadaty zálohy
    const metadata = {
      timestamp: new Date().toISOString(),
      stats: {
        courses: courses.length,
        modules: courses.reduce((sum, course) => sum + course.modules.length, 0),
        lessons: courses.reduce((sum, course) => 
          sum + course.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0),
        users: users.length,
        userCourses: userCourses.length
      }
    };
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('✅ Záloha dokončena!');
    console.log(`📁 Všechna data byla uložena do: ${currentBackupDir}`);
    console.log('Statistiky zálohy:');
    console.log(`- Kurzů: ${metadata.stats.courses}`);
    console.log(`- Modulů: ${metadata.stats.modules}`);
    console.log(`- Lekcí: ${metadata.stats.lessons}`);
    console.log(`- Uživatelů: ${metadata.stats.users}`);
    console.log(`- Přístupů ke kurzům: ${metadata.stats.userCourses}`);
    
  } catch (error) {
    console.error('❌ Chyba při zálohování databáze:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
