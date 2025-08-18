// Skript pro nastavení role admin pro uživatele
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Email uživatele, kterému chcete nastavit roli admin
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Chyba: Musíte zadat email uživatele jako parametr');
  console.error('Použití: node scripts/set-admin.js vas@email.cz');
  process.exit(1);
}

async function setAdminRole() {
  try {
    console.log(`Hledám uživatele s emailem: ${userEmail}`);
    
    // Najít uživatele podle emailu
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.error(`Uživatel s emailem ${userEmail} nebyl nalezen`);
      process.exit(1);
    }
    
    console.log(`Nalezen uživatel: ${user.name || user.email} (ID: ${user.id})`);
    console.log(`Současná role: ${user.role}`);
    
    // Aktualizovat roli na admin
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    });
    
    console.log(`Role byla úspěšně změněna na: ${updatedUser.role}`);
    console.log('Uživatel je nyní administrátor');
    
  } catch (error) {
    console.error('Chyba při nastavování role admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
