// Bezpečný skript pro obnovení databáze ze zálohy
// Použití: node restore-database-safe.js cesta/k/záloze
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Načtení proměnných prostředí z .env souboru
dotenv.config({ path: path.join(__dirname, '../.env') });

// Kontrola, zda jsou nastaveny potřebné proměnné prostředí
if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
  console.error('❌ Chyba: Není nastavena žádná databázová URL');
  process.exit(1);
}

// Jednoduchá podpora pro Prisma Accelerate
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

// Vytvoření instance Prisma klienta
const prisma = new PrismaClient();

// Funkce pro kontrolu integrity zálohy
function validateBackup(backupPath) {
  console.log('🔍 Kontroluji integritu zálohy...');
  
  const requiredFiles = [
    'courses.json',
    'users.json', 
    'user-courses.json',
    'blog-posts.json',
    'metadata.json'
  ];
  
  const optionalFiles = [
    'auth-tokens.json',
    'user-lesson-progress.json'
  ];
  
  // Kontrola povinných souborů
  for (const file of requiredFiles) {
    const filePath = path.join(backupPath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Chybí povinný soubor: ${file}`);
      return false;
    }
  }
  
  // Kontrola metadata
  const metadataPath = path.join(backupPath, 'metadata.json');
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`📊 Záloha z: ${metadata.timestamp}`);
    console.log(`📋 Verze: ${metadata.version || 'neznámá'}`);
    console.log(`💾 Celkem záznamů: ${metadata.totalRecords || 'neznámo'}`);
  } catch (error) {
    console.warn('⚠️  Nelze načíst metadata zálohy');
  }
  
  console.log('✅ Integrita zálohy v pořádku');
  return true;
}

// Funkce pro načtení dat ze zálohy
function loadBackupData(backupPath) {
  console.log('📥 Načítám data ze zálohy...');
  
  const data = {};
  
  // Načtení povinných souborů
  data.courses = JSON.parse(fs.readFileSync(path.join(backupPath, 'courses.json'), 'utf8'));
  data.users = JSON.parse(fs.readFileSync(path.join(backupPath, 'users.json'), 'utf8'));
  data.userCourses = JSON.parse(fs.readFileSync(path.join(backupPath, 'user-courses.json'), 'utf8'));
  data.blogPosts = JSON.parse(fs.readFileSync(path.join(backupPath, 'blog-posts.json'), 'utf8'));
  
  // Načtení volitelných souborů
  const authTokensPath = path.join(backupPath, 'auth-tokens.json');
  if (fs.existsSync(authTokensPath)) {
    data.authTokens = JSON.parse(fs.readFileSync(authTokensPath, 'utf8'));
  } else {
    data.authTokens = [];
  }
  
  const userLessonProgressPath = path.join(backupPath, 'user-lesson-progress.json');
  if (fs.existsSync(userLessonProgressPath)) {
    data.userLessonProgress = JSON.parse(fs.readFileSync(userLessonProgressPath, 'utf8'));
  } else {
    data.userLessonProgress = [];
  }
  
  console.log(`📊 Načteno:`);
  console.log(`   📚 ${data.courses.length} kurzů`);
  console.log(`   👥 ${data.users.length} uživatelů`);
  console.log(`   🔑 ${data.userCourses.length} přístupů ke kurzům`);
  console.log(`   📝 ${data.blogPosts.length} blog postů`);
  console.log(`   🔐 ${data.authTokens.length} auth tokenů`);
  console.log(`   📈 ${data.userLessonProgress.length} pokroků v lekcích`);
  
  return data;
}

// Funkce pro vytvoření zálohy před obnovením
async function createSafetyBackup() {
  console.log('🛡️  Vytvářím bezpečnostní zálohu před obnovením...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safetyBackupPath = path.join(__dirname, '../backups', `safety-backup-${timestamp}`);
  
  try {
    // Spustíme backup script
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const backupProcess = spawn('node', [path.join(__dirname, 'backup-db.js')], {
        stdio: 'inherit'
      });
      
      backupProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Bezpečnostní záloha vytvořena');
          resolve();
        } else {
          reject(new Error(`Backup process exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('❌ Nepodařilo se vytvořit bezpečnostní zálohu:', error);
    throw error;
  }
}

// Hlavní funkce pro obnovení
async function restoreDatabase() {
  try {
    console.log('🔄 Zahajuji bezpečné obnovení databáze ze zálohy...');
    
    // Kontrola argumentů
    if (process.argv.length < 3) {
      console.error('❌ Chyba: Nebyla zadána cesta k záloze');
      console.log('📖 Použití: node restore-database-safe.js cesta/k/záloze');
      process.exit(1);
    }
    
    const backupPath = process.argv[2];
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Chyba: Zadaná cesta k záloze neexistuje: ${backupPath}`);
      process.exit(1);
    }
    
    // Kontrola integrity zálohy
    if (!validateBackup(backupPath)) {
      console.error('❌ Záloha není validní');
      process.exit(1);
    }
    
    console.log(`🔗 Připojuji se k databázi...`);
    console.log(`📂 Obnovuji ze zálohy: ${backupPath}`);
    
    // Načtení dat ze zálohy
    const data = loadBackupData(backupPath);
    
    // Potvrzení od uživatele
    console.log('\n⚠️  KRITICKÉ VAROVÁNÍ:');
    console.log('🚨 Obnovení KOMPLETNĚ PŘEPÍŠE všechna existující data v databázi!');
    console.log('🛡️  Před obnovením bude vytvořena bezpečnostní záloha současného stavu.');
    console.log('📋 Pro pokračování zadejte "OBNOVIT" (velkými písmeny):');
    
    // Načtení vstupu od uživatele
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('➤ ', async (answer) => {
      if (answer !== 'OBNOVIT') {
        console.log('❌ Obnovení zrušeno uživatelem.');
        readline.close();
        await prisma.$disconnect();
        process.exit(0);
      }
      
      readline.close();
      
      try {
        // Vytvoření bezpečnostní zálohy
        await createSafetyBackup();
        
        console.log('\n🔄 Zahajuji obnovení dat...');
        
        // Obnovení v transakci pro atomicitu
        await prisma.$transaction(async (tx) => {
          
          // 1. Odstranění existujících dat (v správném pořadí kvůli cizím klíčům)
          console.log('🗑️  Odstraňuji existující data...');
          
          await tx.userLessonProgress.deleteMany({});
          console.log('   ✅ Odstraněn pokrok v lekcích');
          
          await tx.authToken.deleteMany({});
          console.log('   ✅ Odstraněny auth tokeny');
          
          await tx.userCourse.deleteMany({});
          console.log('   ✅ Odstraněny přístupy ke kurzům');
          
          await tx.blogPost.deleteMany({});
          console.log('   ✅ Odstraněny blog posty');
          
          // Odstranění materiálů, lekcí a modulů
          await tx.material.deleteMany({});
          await tx.lesson.deleteMany({});
          await tx.module.deleteMany({});
          console.log('   ✅ Odstraněny materiály, lekce a moduly');
          
          await tx.course.deleteMany({});
          console.log('   ✅ Odstraněny kurzy');
          
          // Neodstraňujeme uživatele, pouze je aktualizujeme
          
          // 2. Obnovení dat
          console.log('\n📥 Obnovuji data...');
          
          // Blog posty
          for (const blogPost of data.blogPosts) {
            await tx.blogPost.create({
              data: blogPost
            });
          }
          console.log('   ✅ Obnoveny blog posty');
          
          // Kurzy s vnořenými daty
          for (const course of data.courses) {
            const { modules, ...courseData } = course;
            await tx.course.create({
              data: courseData
            });
            
            // Moduly - seřazení podle order
            const sortedModules = [...(modules || [])].sort((a, b) => a.order - b.order);
            for (const module of sortedModules) {
              const { lessons, ...moduleData } = module;
              await tx.module.create({
                data: moduleData
              });
              
              // Lekce - seřazení podle order
              const sortedLessons = [...(lessons || [])].sort((a, b) => a.order - b.order);
              for (const lesson of sortedLessons) {
                const { materials, ...lessonData } = lesson;
                await tx.lesson.create({
                  data: lessonData
                });
                
                // Materiály
                const sortedMaterials = [...(materials || [])];
                if (sortedMaterials.length > 0 && 'order' in sortedMaterials[0]) {
                  sortedMaterials.sort((a, b) => a.order - b.order);
                }
                
                for (const material of sortedMaterials) {
                  await tx.material.create({
                    data: material
                  });
                }
              }
            }
          }
          console.log('   ✅ Obnoveny kurzy, moduly, lekce a materiály');
          
          // Uživatelé (upsert pro bezpečnost)
          for (const user of data.users) {
            await tx.user.upsert({
              where: { id: user.id },
              update: user,
              create: user
            });
          }
          console.log('   ✅ Obnoveni uživatelé');
          
          // Přístupy ke kurzům
          for (const userCourse of data.userCourses) {
            await tx.userCourse.create({
              data: userCourse
            });
          }
          console.log('   ✅ Obnoveny přístupy ke kurzům');
          
          // Auth tokeny
          for (const authToken of data.authTokens) {
            await tx.authToken.create({
              data: authToken
            });
          }
          console.log('   ✅ Obnoveny auth tokeny');
          
          // Pokrok v lekcích
          for (const progress of data.userLessonProgress) {
            await tx.userLessonProgress.create({
              data: progress
            });
          }
          console.log('   ✅ Obnoven pokrok v lekcích');
          
        });
        
        console.log('\n🎉 Obnovení databáze úspěšně dokončeno!');
        console.log('📊 Všechna data byla obnovena ze zálohy.');
        
      } catch (error) {
        console.error('\n❌ Kritická chyba při obnovování dat:', error);
        console.log('🛡️  Doporučuji obnovit ze safety zálohy, která byla vytvořena před obnovením.');
        process.exit(1);
      } finally {
        await prisma.$disconnect();
      }
    });
    
  } catch (error) {
    console.error('❌ Chyba při obnovení databáze:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Spuštění
restoreDatabase();
