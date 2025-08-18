import { PrismaClient } from '@prisma/client';

// Inicializace Prisma klienta
const prisma = new PrismaClient();

async function checkDuplicateMaterials() {
  console.log('Kontroluji duplicitní materiály v databázi...');
  
  try {
    // Získáme všechny lekce s jejich materiály
    const lessons = await prisma.lesson.findMany({
      include: {
        materials: true,
        module: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Celkový počet lekcí: ${lessons.length}`);
    
    // Pro každou lekci zkontrolujeme duplicitní materiály
    let totalDuplicates = 0;
    
    for (const lesson of lessons) {
      // Vytvoříme mapu pro kontrolu duplicit podle názvu a URL
      const materialMap = new Map();
      const duplicates = [];
      
      for (const material of lesson.materials) {
        const key = `${material.title}-${material.url || ''}`;
        
        if (materialMap.has(key)) {
          duplicates.push({
            original: materialMap.get(key),
            duplicate: material
          });
          totalDuplicates++;
        } else {
          materialMap.set(key, material);
        }
      }
      
      // Pokud jsme našli duplicity, vypíšeme je
      if (duplicates.length > 0) {
        console.log(`\nNalezeny duplicitní materiály v lekci "${lesson.title}" (ID: ${lesson.id})`);
        console.log(`Modul: "${lesson.module.title}", Kurz: "${lesson.module.course.title}"`);
        console.log(`Počet duplicit: ${duplicates.length}`);
        
        duplicates.forEach((dup, index) => {
          console.log(`\nDuplikát #${index + 1}:`);
          console.log(`Původní: ID=${dup.original.id}, Název=${dup.original.title}, URL=${dup.original.url || 'prázdné'}, Vytvořeno=${dup.original.createdAt}`);
          console.log(`Duplikát: ID=${dup.duplicate.id}, Název=${dup.duplicate.title}, URL=${dup.duplicate.url || 'prázdné'}, Vytvořeno=${dup.duplicate.createdAt}`);
        });
      }
    }
    
    console.log(`\n=== Souhrn ===`);
    console.log(`Celkový počet nalezených duplicitních materiálů: ${totalDuplicates}`);
    
    if (totalDuplicates === 0) {
      console.log('V databázi nebyly nalezeny žádné duplicitní materiály.');
    }
    
  } catch (error) {
    console.error('Chyba při kontrole duplicitních materiálů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Spustíme kontrolu
checkDuplicateMaterials();
