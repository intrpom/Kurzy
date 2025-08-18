// Jednoduchý skript pro import kurzů do databáze
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definice kurzů
const courses = [
  {
    slug: 'sebepoznani-a-rozvoj',
    title: 'Sebepoznání a rozvoj',
    subtitle: 'Objevte svůj potenciál a cestu k osobnímu růstu',
    description: 'Tento kurz vám pomůže lépe porozumět sobě samému, svým silným stránkám a oblastem pro rozvoj. Naučíte se techniky sebepoznání, práce s emocemi a stanovování cílů pro osobní růst.',
    imageUrl: '/images/courses/sebepoznani.jpg',
    price: 990,
    isFeatured: true,
    level: 'beginner',
    tags: ['sebepoznání', 'osobní rozvoj', 'emoce']
  },
  {
    slug: 'zvladani-stresu',
    title: 'Zvládání stresu',
    subtitle: 'Efektivní techniky pro redukci stresu a úzkosti',
    description: 'Naučte se rozpoznávat příznaky stresu a používat osvědčené techniky pro jeho zvládání. Kurz kombinuje teoretické poznatky s praktickými cvičeními pro okamžité použití v každodenním životě.',
    imageUrl: '/images/courses/stres.jpg',
    price: 0,
    level: 'beginner',
    tags: ['stres', 'relaxace', 'mindfulness']
  },
  {
    slug: 'komunikacni-dovednosti',
    title: 'Komunikační dovednosti',
    subtitle: 'Zlepšete své vztahy díky efektivní komunikaci',
    description: 'Tento kurz vám pomůže zlepšit vaše komunikační dovednosti, naučí vás aktivně naslouchat, jasně vyjadřovat své myšlenky a efektivně řešit konflikty.',
    imageUrl: '/images/courses/komunikace.jpg',
    price: 1290,
    isFeatured: true,
    level: 'intermediate',
    tags: ['komunikace', 'vztahy', 'konflikty']
  },
  {
    slug: 'mindfulness-v-praxi',
    title: 'Mindfulness v praxi',
    subtitle: 'Každodenní všímavost pro klidnější a spokojenější život',
    description: 'Praktický kurz mindfulness, který vám pomůže implementovat techniky všímavosti do vašeho každodenního života. Naučíte se být více přítomní, snížit stres a zlepšit svou celkovou pohodu.',
    imageUrl: '/images/courses/mindfulness.jpg',
    price: 890,
    level: 'beginner',
    tags: ['mindfulness', 'meditace', 'všímavost']
  }
];

// Funkce pro import kurzů
async function importCourses() {
  console.log('Začínám import kurzů...');
  
  try {
    // Test připojení k databázi
    await prisma.$connect();
    console.log('✅ Připojení k databázi úspěšné');
    
    // Kontrola, zda již existují nějaké kurzy v databázi
    const existingCoursesCount = await prisma.course.count();
    console.log(`Nalezeno ${existingCoursesCount} existujících kurzů v databázi`);
    
    if (existingCoursesCount > 0) {
      console.log('Databáze již obsahuje kurzy. Přeskakuji import.');
      return;
    }
    
    // Import kurzů
    for (const course of courses) {
      console.log(`Importuji kurz: ${course.title}`);
      
      const createdCourse = await prisma.course.create({
        data: {
          slug: course.slug,
          title: course.title,
          subtitle: course.subtitle || '',
          description: course.description,
          imageUrl: course.imageUrl,
          price: course.price,
          isFeatured: course.isFeatured || false,
          level: course.level || 'beginner',
          tags: course.tags || [],
          progress: 0,
          completed: false
        }
      });
      
      console.log(`✅ Kurz vytvořen s ID: ${createdCourse.id}`);
      
      // Vytvoření ukázkových modulů pro každý kurz
      const module1 = await prisma.module.create({
        data: {
          title: `Úvod do ${course.title}`,
          description: `Základní informace o kurzu ${course.title}`,
          order: 1,
          completed: false,
          courseId: createdCourse.id
        }
      });
      
      console.log(`✅ Modul vytvořen s ID: ${module1.id}`);
      
      // Vytvoření ukázkových lekcí pro modul
      const lesson1 = await prisma.lesson.create({
        data: {
          title: 'Úvodní lekce',
          description: 'Seznámení s obsahem kurzu',
          duration: 15,
          videoUrl: '/videos/uvod.mp4',
          order: 1,
          completed: false,
          moduleId: module1.id
        }
      });
      
      console.log(`✅ Lekce vytvořena s ID: ${lesson1.id}`);
      
      // Vytvoření ukázkového materiálu pro lekci
      await prisma.material.create({
        data: {
          title: 'Úvodní materiál',
          type: 'pdf',
          url: '/materials/uvod.pdf',
          content: 'Obsah úvodního materiálu',
          lessonId: lesson1.id
        }
      });
      
      console.log(`✅ Materiál vytvořen pro lekci ${lesson1.id}`);
    }
    
    console.log('✅ Import kurzů dokončen úspěšně!');
  } catch (error) {
    console.error('❌ Chyba při importu kurzů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Spuštění importu
importCourses()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
