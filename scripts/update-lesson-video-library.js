// Skript pro přímou aktualizaci videoLibraryId u lekce
// Spouštějte pomocí: node scripts/update-lesson-video-library.js LESSON_ID VIDEO_LIBRARY_ID

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLessonVideoLibrary(lessonId, videoLibraryId) {
  try {
    console.log(`Aktualizuji lekci ${lessonId} s videoLibraryId: ${videoLibraryId}`);
    
    // Kontrola, zda lekce existuje
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });
    
    if (!existingLesson) {
      console.error(`Lekce s ID ${lessonId} nebyla nalezena`);
      return;
    }
    
    // Přímá aktualizace v databázi
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoLibraryId: videoLibraryId
      }
    });
    
    console.log(`Lekce byla úspěšně aktualizována:`);
    console.log(`- ID: ${updatedLesson.id}`);
    console.log(`- Název: ${updatedLesson.title}`);
    console.log(`- VideoLibraryId: ${updatedLesson.videoLibraryId}`);
    
  } catch (error) {
    console.error('Chyba při aktualizaci lekce:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Zpracování argumentů z příkazové řádky
const lessonId = process.argv[2];
const videoLibraryId = process.argv[3];

if (!lessonId || !videoLibraryId) {
  console.error('Použití: node scripts/update-lesson-video-library.js LESSON_ID VIDEO_LIBRARY_ID');
  process.exit(1);
}

updateLessonVideoLibrary(lessonId, videoLibraryId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Neočekávaná chyba:', error);
    process.exit(1);
  });
