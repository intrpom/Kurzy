// Skript pro kontrolu obsahu databáze
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Kontroluji obsah databáze...');
    
    // Načtení všech kurzů s moduly a lekcemi
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
    
    console.log(`Nalezeno ${courses.length} kurzů:`);
    
    courses.forEach(course => {
      console.log(`\nKurz: ${course.title} (${course.id})`);
      console.log(`- Slug: ${course.slug}`);
      console.log(`- Počet modulů: ${course.modules.length}`);
      
      course.modules.forEach(module => {
        console.log(`  Modul: ${module.title} (${module.id})`);
        console.log(`  - Počet lekcí: ${module.lessons.length}`);
        
        module.lessons.forEach(lesson => {
          console.log(`    Lekce: ${lesson.title} (${lesson.id})`);
          console.log(`    - Počet materiálů: ${lesson.materials.length}`);
        });
      });
    });
    
  } catch (error) {
    console.error('Chyba při kontrole databáze:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
