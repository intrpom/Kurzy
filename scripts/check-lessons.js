const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLessons() {
  try {
    // Najít kurz "Jak ukáznit zlobivou hlavu?"
    const course = await prisma.course.findFirst({
      where: {
        title: {
          contains: "Jak ukáznit zlobivou hlavu"
        }
      },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!course) {
      console.log('Kurz nebyl nalezen');
      return;
    }

    console.log(`Kurz: ${course.title} (${course.id})`);
    
    for (const module of course.modules) {
      console.log(`\nModul: ${module.title} (${module.id})`);
      console.log('Lekce:');
      
      for (const lesson of module.lessons) {
        console.log(`  - ${lesson.title} (${lesson.id}), pořadí: ${lesson.order}`);
      }
    }
  } catch (error) {
    console.error('Chyba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLessons();
