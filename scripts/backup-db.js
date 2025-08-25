#!/usr/bin/env node

// Skript pro zálohování databáze lokálně
// Použití: node scripts/backup-to-github.js
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

// Vytvoření instance Prisma klienta
const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🚀 Spouštím zálohování databáze...\n');
    
    // 1. KROK: Zálohování databáze
    console.log('📊 1. Zálohuji databázi...');
    
    // Určení cílové složky pro zálohy
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Vytvoření složky s časovým razítkem pro tuto zálohu
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(currentBackupDir);
    
    console.log(`   Zálohuji do složky: ${currentBackupDir}`);
    
    // Záloha kurzů včetně modulů, lekcí a materiálů
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
    
    // Záloha uživatelů (bez citlivých údajů)
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
    
    // Záloha přístupů uživatelů ke kurzům
    const userCourses = await prisma.userCourse.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'user-courses.json'),
      JSON.stringify(userCourses, null, 2)
    );
    
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
    
    console.log(`   ✅ Záloha dokončena!`);
    console.log(`   📁 Data uložena do: ${currentBackupDir}`);
    console.log(`   📊 Statistiky: ${metadata.stats.courses} kurzů, ${metadata.stats.modules} modulů, ${metadata.stats.lessons} lekcí, ${metadata.stats.users} uživatelů\n`);
    
    console.log('✅ Záloha dokončena!');
    console.log('\n📋 Pro nahrání na GitHub použij:');
    console.log('   git add .');
    console.log('   git commit -m "Záloha databáze"');
    console.log('   git push origin main');
    console.log('\n💡 Nebo použij: git add . && git commit -m "Záloha databáze" && git push origin main');
    
  } catch (error) {
    console.error('❌ Chyba při zálohování:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Spuštění skriptu
backupDatabase();
