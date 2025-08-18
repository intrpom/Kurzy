// Skript pro počítání položek v databázi
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countItems() {
  try {
    console.log('Počítám položky v databázi...');
    
    // Počet kurzů
    const courseCount = await prisma.course.count();
    console.log(`Celkový počet kurzů: ${courseCount}`);
    
    // Počet modulů
    const moduleCount = await prisma.module.count();
    console.log(`Celkový počet modulů: ${moduleCount}`);
    
    // Počet lekcí
    const lessonCount = await prisma.lesson.count();
    console.log(`Celkový počet lekcí: ${lessonCount}`);
    
    // Počet materiálů
    const materialCount = await prisma.material.count();
    console.log(`Celkový počet materiálů: ${materialCount}`);
    
    // Detailní informace o kurzech
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    console.log('\nDetailní přehled kurzů:');
    courses.forEach(course => {
      const moduleCount = course.modules.length;
      const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const materialCount = course.modules.reduce((sum, module) => 
        sum + module.lessons.reduce((sum, lesson) => sum + lesson.materials.length, 0), 0);
      
      console.log(`\nKurz: ${course.title}`);
      console.log(`- Počet modulů: ${moduleCount}`);
      console.log(`- Počet lekcí: ${lessonCount}`);
      console.log(`- Počet materiálů: ${materialCount}`);
    });
    
  } catch (error) {
    console.error('Chyba při počítání položek:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countItems();
