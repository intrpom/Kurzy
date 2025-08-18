const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMaterials() {
  try {
    console.log('Hledám materiály s názvem "Úvodní materiál"...');
    
    const materials = await prisma.material.findMany({
      where: {
        title: 'Úvodní materiál'
      },
      include: {
        lesson: true
      }
    });
    
    console.log(`Nalezeno ${materials.length} materiálů s názvem "Úvodní materiál":`);
    materials.forEach(material => {
      console.log(`- ID: ${material.id}, Lekce: ${material.lesson?.title || 'Neznámá'}`);
    });
    
  } catch (error) {
    console.error('Chyba při hledání materiálů:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMaterials();
