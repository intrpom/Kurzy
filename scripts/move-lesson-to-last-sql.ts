import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveLessonToLast() {
  try {
    console.log('Hledám lekci "Kdo podvědomí programuje?"');
    
    // Najít lekci podle přesného názvu
    const lesson = await prisma.lesson.findFirst({
      where: {
        title: "Kdo podvědomí programuje?"
      },
      include: {
        module: true
      }
    });
    
    if (!lesson) {
      console.error('Lekce s názvem obsahujícím "Kdo podvědomí programuje" nebyla nalezena');
      return;
    }
    
    console.log(`Nalezena lekce: ID=${lesson.id}, Název=${lesson.title}, Aktuální pořadí=${lesson.order}, ModuleID=${lesson.moduleId}`);
    
    // Najít nejvyšší pořadí v modulu
    const highestOrderResult = await prisma.$queryRaw<{ maxOrder: number }[]>`
      SELECT MAX("order") as "maxOrder" FROM "Lesson" WHERE "moduleId" = ${lesson.moduleId}
    `;
    
    const highestOrder = Number(highestOrderResult[0]?.maxOrder || 0);
    const newOrder = highestOrder + 1;
    
    console.log(`Nejvyšší aktuální pořadí v modulu: ${highestOrder}`);
    console.log(`Nastavuji lekci na nové pořadí: ${newOrder}`);
    
    // Aktualizovat pořadí lekce pomocí SQL
    await prisma.$executeRaw`
      UPDATE "Lesson" SET "order" = ${newOrder} WHERE id = ${lesson.id}
    `;
    
    // Ověřit, že změna byla provedena
    const updatedLesson = await prisma.lesson.findUnique({
      where: {
        id: lesson.id
      }
    });
    
    console.log(`Lekce byla úspěšně přesunuta na poslední místo.`);
    console.log(`Aktualizovaná lekce: ID=${updatedLesson?.id}, Název=${updatedLesson?.title}, Nové pořadí=${updatedLesson?.order}`);
    
    // Vypsat všechny lekce v modulu pro kontrolu
    const allLessons = await prisma.lesson.findMany({
      where: {
        moduleId: lesson.moduleId
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    console.log('\nVšechny lekce v modulu po změně:');
    allLessons.forEach(l => {
      console.log(`ID: ${l.id}, Název: ${l.title}, Pořadí: ${l.order}`);
    });
    
  } catch (error) {
    console.error('Došlo k chybě při přesouvání lekce:', error);
  } finally {
    await prisma.$disconnect();
  }
}

moveLessonToLast()
  .then(() => console.log('Operace dokončena'))
  .catch(e => console.error('Chyba při provádění operace:', e));
