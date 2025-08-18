// Skript pro změnu pořadí lekcí
// Použití: node swap-lessons.js lessonId1 lessonId2
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

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

async function swapLessons() {
  try {
    // Kontrola argumentů
    if (process.argv.length < 4) {
      console.error('Chyba: Nebyly zadány ID lekcí k prohození');
      console.log('Použití: node swap-lessons.js lessonId1 lessonId2');
      console.log('Nebo pro změnu pořadí: node swap-lessons.js lessonId newOrder');
      process.exit(1);
    }
    
    const lessonId1 = process.argv[2];
    const lessonId2OrNewOrder = process.argv[3];
    
    // Zjistíme, zda druhý argument je ID lekce nebo nové pořadí
    const isNumber = !isNaN(parseInt(lessonId2OrNewOrder));
    
    if (isNumber) {
      // Změna pořadí jedné lekce
      const newOrder = parseInt(lessonId2OrNewOrder);
      await changeOrder(lessonId1, newOrder);
    } else {
      // Prohození dvou lekcí
      await swapTwoLessons(lessonId1, lessonId2OrNewOrder);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Chyba při prohazování lekcí:', error);
    process.exit(1);
  }
}

async function changeOrder(lessonId, newOrder) {
  console.log(`Měním pořadí lekce ${lessonId} na ${newOrder}...`);
  
  // Načtení lekce
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  });
  
  if (!lesson) {
    console.error(`Chyba: Lekce s ID ${lessonId} nebyla nalezena`);
    process.exit(1);
  }
  
  console.log(`Nalezena lekce: "${lesson.title}" (aktuální pořadí: ${lesson.order})`);
  
  // Aktualizace pořadí
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { order: newOrder }
  });
  
  console.log(`✅ Pořadí lekce "${lesson.title}" změněno z ${lesson.order} na ${newOrder}`);
}

async function swapTwoLessons(lessonId1, lessonId2) {
  console.log(`Prohazuji lekce ${lessonId1} a ${lessonId2}...`);
  
  // Načtení obou lekcí
  const lesson1 = await prisma.lesson.findUnique({
    where: { id: lessonId1 }
  });
  
  const lesson2 = await prisma.lesson.findUnique({
    where: { id: lessonId2 }
  });
  
  if (!lesson1) {
    console.error(`Chyba: Lekce s ID ${lessonId1} nebyla nalezena`);
    process.exit(1);
  }
  
  if (!lesson2) {
    console.error(`Chyba: Lekce s ID ${lessonId2} nebyla nalezena`);
    process.exit(1);
  }
  
  console.log(`Nalezeny lekce:`);
  console.log(`1. "${lesson1.title}" (pořadí: ${lesson1.order})`);
  console.log(`2. "${lesson2.title}" (pořadí: ${lesson2.order})`);
  
  // Prohození pořadí
  await prisma.lesson.update({
    where: { id: lessonId1 },
    data: { order: lesson2.order }
  });
  
  await prisma.lesson.update({
    where: { id: lessonId2 },
    data: { order: lesson1.order }
  });
  
  console.log(`✅ Lekce byly úspěšně prohozeny:`);
  console.log(`- "${lesson1.title}" má nyní pořadí ${lesson2.order}`);
  console.log(`- "${lesson2.title}" má nyní pořadí ${lesson1.order}`);
}

// Přidání funkce pro výpis všech lekcí
async function listLessons() {
  console.log('Načítám seznam všech lekcí...');
  
  // Načtení všech kurzů s moduly a lekcemi
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  });
  
  console.log('\nSeznam všech lekcí:');
  console.log('===================');
  
  for (const course of courses) {
    console.log(`\nKurz: ${course.title}`);
    
    for (const module of course.modules) {
      console.log(`\n  Modul: ${module.title}`);
      
      // Seřazení lekcí podle pořadí
      const sortedLessons = [...module.lessons].sort((a, b) => a.order - b.order);
      
      for (const lesson of sortedLessons) {
        console.log(`    Lekce: "${lesson.title}" (ID: ${lesson.id}, pořadí: ${lesson.order})`);
      }
    }
  }
}

// Kontrola, zda byl skript spuštěn s argumentem --list
if (process.argv.length === 3 && process.argv[2] === '--list') {
  listLessons()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
} else {
  swapLessons();
}
