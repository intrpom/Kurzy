import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveLessonToLast() {
  try {
    console.log('Hledám lekci "Kdo podvědomí programuje?"');
    
    // Najít lekci podle názvu
    const lesson = await prisma.lesson.findFirst({
      where: {
        title: 'Kdo podvědomí programuje?'
      },
      include: {
        module: true
      }
    });
    
    if (!lesson) {
      console.error('Lekce s názvem "Kdo podvědomí programuje?" nebyla nalezena');
      return;
    }
    
    console.log(`Nalezena lekce: ID=${lesson.id}, Název=${lesson.title}, Aktuální pořadí=${lesson.order}`);
    
    // Najít všechny lekce v modulu
    const moduleLessons = await prisma.lesson.findMany({
      where: {
        moduleId: lesson.moduleId
      },
      orderBy: {
        order: 'desc'
      },
      take: 1
    });
    
    if (moduleLessons.length === 0) {
      console.error('Nepodařilo se najít lekce v modulu');
      return;
    }
    
    const highestOrder = moduleLessons[0].order;
    const newOrder = highestOrder + 1;
    
    console.log(`Nejvyšší aktuální pořadí v modulu: ${highestOrder}`);
    console.log(`Nastavuji lekci na nové pořadí: ${newOrder}`);
    
    // Aktualizovat pořadí lekce
    const updatedLesson = await prisma.lesson.update({
      where: {
        id: lesson.id
      },
      data: {
        order: newOrder
      }
    });
    
    console.log(`Lekce byla úspěšně přesunuta na poslední místo.`);
    console.log(`Aktualizovaná lekce: ID=${updatedLesson.id}, Název=${updatedLesson.title}, Nové pořadí=${updatedLesson.order}`);
    
  } catch (error) {
    console.error('Došlo k chybě při přesouvání lekce:', error);
  } finally {
    await prisma.$disconnect();
  }
}

moveLessonToLast()
  .then(() => console.log('Operace dokončena'))
  .catch(e => console.error('Chyba při provádění operace:', e));
