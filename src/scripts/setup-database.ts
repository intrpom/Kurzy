import { PrismaClient } from '@prisma/client';
import * as courseModule from '../types/course';

const courses = courseModule.courses;

/**
 * Tento skript pomáhá s nastavením databáze a migrací existujících kurzů
 * 
 * Před spuštěním se ujistěte, že máte správně nastavený DATABASE_URL v .env souboru
 * 
 * Použití:
 * 1. Vytvořte .env soubor s DATABASE_URL
 * 2. Spusťte: npx ts-node src/scripts/setup-database.ts
 */

const prisma = new PrismaClient();

async function main() {
  console.log('Začínám nastavení databáze a migraci kurzů...');

  try {
    // Test připojení k databázi
    await prisma.$connect();
    console.log('✅ Připojení k databázi úspěšné');

    // Kontrola, zda již existují nějaké kurzy v databázi
    const existingCoursesCount = await prisma.course.count();
    console.log(`Nalezeno ${existingCoursesCount} existujících kurzů v databázi`);

    if (existingCoursesCount > 0) {
      console.log('Databáze již obsahuje kurzy. Přeskakuji migraci.');
      return;
    }

    console.log('Začínám migraci kurzů...');
    
    // Pro každý kurz v existujícím poli kurzů
    for (const course of courses) {
      console.log(`Migrace kurzu: ${course.title}`);

      // Vytvoření kurzu v databázi
      const dbCourse = await prisma.course.create({
        data: {
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          imageUrl: course.imageUrl,
          price: course.price,
          isFeatured: course.isFeatured || false,
          level: course.level,
          tags: course.tags || [],
          progress: course.progress,
          completed: course.completed || false
        }
      });

      console.log(`Kurz vytvořen s ID: ${dbCourse.id}`);

      // Pro každý modul v kurzu
      for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
        const moduleData = course.modules[moduleIndex];
        
        console.log(`Migrace modulu: ${moduleData.title}`);

        // Vytvoření modulu v databázi
        const dbModule = await prisma.module.create({
          data: {
            title: moduleData.title,
            description: moduleData.description,
            order: moduleIndex + 1,
            completed: moduleData.completed || false,
            courseId: dbCourse.id
          }
        });

        console.log(`Modul vytvořen s ID: ${dbModule.id}`);

        // Pro každou lekci v modulu
        for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
          const lessonData = moduleData.lessons[lessonIndex];
          
          console.log(`Migrace lekce: ${lessonData.title}`);

          // Vytvoření lekce v databázi
          const dbLesson = await prisma.lesson.create({
            data: {
              title: lessonData.title,
              description: lessonData.description,
              duration: lessonData.duration || 0,
              videoUrl: lessonData.videoUrl,
              order: lessonIndex + 1,
              completed: lessonData.completed || false,
              moduleId: dbModule.id
            }
          });

          console.log(`Lekce vytvořena s ID: ${dbLesson.id}`);

          // Pokud má lekce materiály, vytvoříme je také
          if (lessonData.materials && lessonData.materials.length > 0) {
            for (const materialData of lessonData.materials) {
              await prisma.material.create({
                data: {
                  title: materialData.title,
                  type: materialData.type,
                  url: materialData.url,
                  content: materialData.content,
                  lessonId: dbLesson.id
                }
              });
            }
            console.log(`Vytvořeno ${lessonData.materials.length} materiálů pro lekci`);
          }
        }
      }
    }

    console.log('✅ Migrace kurzů dokončena úspěšně!');
  } catch (error) {
    console.error('❌ Chyba při nastavení databáze nebo migraci kurzů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
