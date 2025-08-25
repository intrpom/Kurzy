#!/usr/bin/env node

// Skript pro zálohování databáze a nahrání na GitHub
// Použití: node scripts/backup-to-github.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

async function backupToGitHub() {
  try {
    console.log('🚀 Spouštím zálohování databáze a nahrání na GitHub...\n');
    
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
    
    // 2. KROK: Git workflow
    console.log('🔄 2. Spouštím Git workflow...');
    
    try {
      // Kontrola Git stavu
      console.log('   📋 Kontroluji Git status...');
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (gitStatus.trim()) {
        console.log('   📝 Nalezeny změny:');
        console.log(gitStatus);
        
        // Přidání všech změn
        console.log('   ➕ Přidávám změny do Git...');
        execSync('git add .', { stdio: 'inherit' });
        
        // Commit s automatickou zprávou
        const commitMessage = `🔄 Záloha databáze - ${new Date().toLocaleString('cs-CZ')}`;
        console.log(`   💾 Commituji změny: "${commitMessage}"`);
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // Push na GitHub
        console.log('   🚀 Nahrávám na GitHub...');
        execSync('git push origin main', { stdio: 'inherit' });
        
        console.log('\n✅ Úspěch! Záloha byla nahrána na GitHub.');
        console.log(`🔗 Repozitář: https://github.com/intrpom/Kurzy`);
        
      } else {
        console.log('   ℹ️  Žádné změny k commitnutí.');
      }
      
    } catch (gitError) {
      console.error('   ❌ Chyba při Git operacích:', gitError.message);
      console.log('   💡 Zkus spustit Git příkazy manuálně:');
      console.log('      git add .');
      console.log('      git commit -m "Záloha databáze"');
      console.log('      git push origin main');
    }
    
  } catch (error) {
    console.error('❌ Chyba při zálohování:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Spuštění skriptu
backupToGitHub();
