// Skript pro obnovení databáze ze zálohy
// Použití: node restore-database.js cesta/k/záloze
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Načtení proměnných prostředí z .env souboru
dotenv.config({ path: path.join(__dirname, '../.env') });

// Kontrola, zda jsou nastaveny potřebné proměnné prostředí
if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
  console.error('Chyba: Není nastavena žádná databázová URL');
  process.exit(1);
}

// Jednoduchá podpora pro Prisma Accelerate
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

// Vytvoření instance Prisma klienta
const prisma = new PrismaClient();

async function restoreDatabase() {
  try {
    console.log('Zahajuji obnovení databáze ze zálohy...');
    
    // Kontrola argumentů
    if (process.argv.length < 3) {
      console.error('Chyba: Nebyla zadána cesta k záloze');
      console.log('Použití: node restore-database.js cesta/k/záloze');
      process.exit(1);
    }
    
    const backupPath = process.argv[2];
    
    if (!fs.existsSync(backupPath)) {
      console.error(`Chyba: Zadaná cesta k záloze neexistuje: ${backupPath}`);
      process.exit(1);
    }
    
    console.log(`Připojuji se k databázi...`);
    console.log(`Obnovuji ze zálohy: ${backupPath}`);
    
    // Načtení dat ze zálohy
    console.log('Načítám data ze zálohy...');
    
    // Kontrola existence souborů
    const coursesPath = path.join(backupPath, 'courses.json');
    const usersPath = path.join(backupPath, 'users.json');
    const userCoursesPath = path.join(backupPath, 'user-courses.json');
    
    if (!fs.existsSync(coursesPath) || !fs.existsSync(usersPath) || !fs.existsSync(userCoursesPath)) {
      console.error('Chyba: Záloha neobsahuje všechny potřebné soubory (courses.json, users.json, user-courses.json)');
      process.exit(1);
    }
    
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userCourses = JSON.parse(fs.readFileSync(userCoursesPath, 'utf8'));
    
    console.log(`Načteno ze zálohy: ${courses.length} kurzů, ${users.length} uživatelů, ${userCourses.length} přístupů ke kurzům`);
    
    // Potvrzení od uživatele před obnovením
    console.log('\n⚠️  VAROVÁNÍ: Obnovení přepíše existující data v databázi!');
    console.log('Pokračujte pouze pokud jste si jisti, že chcete obnovit data ze zálohy.');
    console.log('Pro pokračování zadejte "ANO" (velkými písmeny):');
    
    // Načtení vstupu od uživatele
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('', async (answer) => {
      if (answer !== 'ANO') {
        console.log('Obnovení zrušeno.');
        readline.close();
        await prisma.$disconnect();
        process.exit(0);
      }
      
      readline.close();
      
      console.log('\nZahajuji obnovení dat...');
      
      // Obnovení dat
      try {
        // Nejprve odstraníme existující data (v opačném pořadí kvůli cizím klíčům)
        console.log('Odstraňuji existující data...');
        
        await prisma.userCourse.deleteMany({});
        console.log('✅ Odstraněny přístupy ke kurzům');
        
        // Odstranění materiálů, lekcí a modulů
        for (const course of courses) {
          for (const module of course.modules || []) {
            for (const lesson of module.lessons || []) {
              await prisma.material.deleteMany({
                where: { lessonId: lesson.id }
              });
            }
            await prisma.lesson.deleteMany({
              where: { moduleId: module.id }
            });
          }
          await prisma.module.deleteMany({
            where: { courseId: course.id }
          });
        }
        console.log('✅ Odstraněny materiály, lekce a moduly');
        
        await prisma.course.deleteMany({});
        console.log('✅ Odstraněny kurzy');
        
        // Neodstraňujeme uživatele, pouze je aktualizujeme
        
        // Nyní obnovíme data
        console.log('\nObnovuji data...');
        
        // Obnovení kurzů
        for (const course of courses) {
          const { modules, ...courseData } = course;
          await prisma.course.create({
            data: courseData
          });
          
          // Obnovení modulů - seřazení podle order
          const sortedModules = [...(modules || [])].sort((a, b) => a.order - b.order);
          for (const module of sortedModules) {
            const { lessons, ...moduleData } = module;
            await prisma.module.create({
              data: moduleData
            });
            
            // Obnovení lekcí - seřazení podle order
            const sortedLessons = [...(lessons || [])].sort((a, b) => a.order - b.order);
            for (const lesson of sortedLessons) {
              const { materials, ...lessonData } = lesson;
              await prisma.lesson.create({
                data: lessonData
              });
              
              // Obnovení materiálů - seřazení podle order (pokud existuje)
              const sortedMaterials = [...(materials || [])];
              if (sortedMaterials.length > 0 && 'order' in sortedMaterials[0]) {
                sortedMaterials.sort((a, b) => a.order - b.order);
              }
              
              for (const material of sortedMaterials) {
                await prisma.material.create({
                  data: material
                });
              }
            }
          }
        }
        console.log('✅ Obnoveny kurzy, moduly, lekce a materiály');
        
        // Obnovení uživatelů (pouze aktualizace nebo vytvoření nových)
        for (const user of users) {
          await prisma.user.upsert({
            where: { id: user.id },
            update: user,
            create: user
          });
        }
        console.log('✅ Obnoveni uživatelé');
        
        // Obnovení přístupů ke kurzům
        for (const userCourse of userCourses) {
          await prisma.userCourse.create({
            data: userCourse
          });
        }
        console.log('✅ Obnoveny přístupy ke kurzům');
        
        console.log('\n✅ Obnovení databáze dokončeno!');
        
      } catch (error) {
        console.error('❌ Chyba při obnovování dat:', error);
        process.exit(1);
      } finally {
        await prisma.$disconnect();
      }
    });
    
  } catch (error) {
    console.error('❌ Chyba při obnovení databáze:', error);
    process.exit(1);
  }
}

restoreDatabase();
