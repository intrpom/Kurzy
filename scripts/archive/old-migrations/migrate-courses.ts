import { PrismaClient } from '@prisma/client';
import { courses } from '../types/course';

// Tento skript migruje existující kurzy z TypeScript souborů do databáze

const prisma = new PrismaClient();

async function main() {
  console.log('Začínám migraci kurzů do databáze...');

  try {
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

    console.log('Migrace kurzů dokončena úspěšně!');
  } catch (error) {
    console.error('Chyba při migraci kurzů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
