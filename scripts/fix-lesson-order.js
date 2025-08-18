const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLessonOrder() {
  try {
    // ID kurzu a modulu z předchozího výpisu
    const courseId = 'cmcoz27l5000ln1pvs4jqo0q3';
    const moduleId = 'cmcoz27lp000nn1pv2ekr79gj';
    
    // Nové pořadí lekcí podle požadavku:
    // 1. Pár vřelých slov
    // 2. Osobní vzkaz
    // 3. Animace
    // 4. Na co máme vlastně nárok?
    // 5. Proč mozek člověka lže?
    // 6. Pochopte své podvědomí
    const lessonUpdates = [
      { id: 'cmcoz27m9000pn1pvttt7i9qz', order: 1 },  // Pár vřelých slov -> 1
      { id: 'cmcsercff0001ac0wbflqiuhv', order: 2 },  // Osobní vzkaz -> 2
      { id: 'cmcserjnn0003ac0w46qnlkze', order: 3 },  // Animace -> 3
      { id: '4fbd6b75-759c-4f5d-b82e-c074f599a2fa', order: 4 },  // Na co máme vlastně nárok? -> 4
      { id: 'b1b1f11f-2e44-4c9f-81e9-9fd1d5bc4ae5', order: 5 },  // Proč mozek člověka lže? -> 5
      { id: 'c57d7879-87e7-4f2e-a393-d3ea347e974d', order: 6 }   // Pochopte své podvědomí -> 6
    ];
    
    console.log('Nastavuji nové pořadí lekcí...');
    
    // Aktualizace pořadí lekcí v databázi
    for (const update of lessonUpdates) {
      await prisma.lesson.update({
        where: { id: update.id },
        data: { order: update.order }
      });
      console.log(`Lekce ${update.id} nastavena na pořadí ${update.order}`);
    }
    
    // Kontrola nového pořadí
    const updatedModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('\nNové pořadí lekcí:');
    for (const lesson of updatedModule.lessons) {
      console.log(`  - ${lesson.title} (${lesson.id}), pořadí: ${lesson.order}`);
    }
    
    console.log('\nPořadí lekcí bylo úspěšně aktualizováno!');
  } catch (error) {
    console.error('Chyba při aktualizaci pořadí lekcí:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLessonOrder();
