// Skript pro přidání chybějících modulů a lekcí do kurzů
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingModules() {
  try {
    console.log('Kontroluji kurzy bez modulů...');
    
    // Načtení všech kurzů s moduly
    const courses = await prisma.course.findMany({
      include: {
        modules: true
      }
    });
    
    // Filtrování kurzů bez modulů
    const coursesWithoutModules = courses.filter(course => course.modules.length === 0);
    console.log(`Nalezeno ${coursesWithoutModules.length} kurzů bez modulů.`);
    
    // Přidání modulů a lekcí do kurzů bez modulů
    for (const course of coursesWithoutModules) {
      console.log(`Přidávám modul do kurzu: ${course.title} (${course.id})`);
      
      // Vytvoření modulu
      const module = await prisma.module.create({
        data: {
          title: `Úvod do ${course.title}`,
          description: 'Úvodní modul kurzu',
          order: 1,
          courseId: course.id
        }
      });
      
      console.log(`Vytvořen modul: ${module.title} (${module.id})`);
      
      // Vytvoření lekce v modulu
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Úvodní lekce',
          description: 'První lekce kurzu',
          duration: 15,
          order: 1,
          moduleId: module.id
        }
      });
      
      console.log(`Vytvořena lekce: ${lesson.title} (${lesson.id})`);
      
      // Vytvoření materiálu v lekci
      const material = await prisma.material.create({
        data: {
          title: 'Úvodní materiál',
          type: 'text',
          content: 'Vítejte v kurzu!',
          lessonId: lesson.id
        }
      });
      
      console.log(`Vytvořen materiál: ${material.title} (${material.id})`);
    }
    
    console.log('Hotovo!');
    
  } catch (error) {
    console.error('Chyba při přidávání modulů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingModules();
