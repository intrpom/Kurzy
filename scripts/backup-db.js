#!/usr/bin/env node

// Skript pro zálohování databáze lokálně
// Použití: node scripts/backup-to-github.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');

// Načtení proměnných prostředí z .env souboru
dotenv.config({ path: path.join(__dirname, '../.env') });

// Kontrola, zda je nastavena proměnná DATABASE_URL
if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
  console.error('Chyba: Není nastavena žádná databázová URL');
  process.exit(1);
}

// Vytvoření instance Prisma klienta
const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🚀 Spouštím zálohování databáze...\n');
    
    // 1. KROK: Zálohování databáze
    console.log('📊 1. Zálohuji databázi...');
    
    // Určení cílové složky pro zálohy
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Vytvoření složky s časovým razítkem pro tuto zálohu
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(currentBackupDir);
    
    console.log(`   Zálohuji do složky: ${currentBackupDir}`);
    
    // Záloha kurzů včetně modulů, lekcí a materiálů
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'courses.json'),
      JSON.stringify(courses, null, 2)
    );
    
    // Záloha uživatelů (bez citlivých údajů)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    
    // Záloha přístupů uživatelů ke kurzům
    const userCourses = await prisma.userCourse.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'user-courses.json'),
      JSON.stringify(userCourses, null, 2)
    );
    
    // Záloha blog postů
    const blogPosts = await prisma.blogPost.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'blog-posts.json'),
      JSON.stringify(blogPosts, null, 2)
    );
    
    // Záloha auth tokenů
    const authTokens = await prisma.authToken.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'auth-tokens.json'),
      JSON.stringify(authTokens, null, 2)
    );
    
    // Záloha pokroku uživatelů v lekcích
    const userLessonProgress = await prisma.userLessonProgress.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'user-lesson-progress.json'),
      JSON.stringify(userLessonProgress, null, 2)
    );
    
    // Vytvoření souboru s metadaty zálohy
    const metadata = {
      timestamp: new Date().toISOString(),
      stats: {
        courses: courses.length,
        modules: courses.reduce((sum, course) => sum + course.modules.length, 0),
        lessons: courses.reduce((sum, course) => 
          sum + course.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0),
        users: users.length,
        userCourses: userCourses.length,
        blogPosts: blogPosts.length,
        authTokens: authTokens.length,
        userLessonProgress: userLessonProgress.length
      }
    };
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`   ✅ Záloha dokončena!`);
    console.log(`   📁 Data uložena do: ${currentBackupDir}`);
    console.log(`   📊 Statistiky: ${metadata.stats.courses} kurzů, ${metadata.stats.modules} modulů, ${metadata.stats.lessons} lekcí, ${metadata.stats.blogPosts} blog postů, ${metadata.stats.users} uživatelů, ${metadata.stats.authTokens} tokenů, ${metadata.stats.userLessonProgress} pokroků\n`);
    
    // Kontrolní přehled zálohy
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                           🔍 KONTROLNÍ PŘEHLED ZÁLOHY                        ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    
    // Tabulka s přehledem
    console.log('║ KATEGORIE              │ POČET    │ STATUS        │ POZNÁMKY               ║');
    console.log('╠════════════════════════╪══════════╪═══════════════╪════════════════════════╣');
    
    // Blog posty
    const blogStatus = blogPosts.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const blogVideos = blogPosts.filter(p => p.videoUrl).length;
    const blogNote = blogPosts.length > 0 ? `${blogVideos}/${blogPosts.length} s videem` : 'Žádné';
    console.log(`║ 📝 Blog posty          │ ${blogPosts.length.toString().padEnd(8)} │ ${blogStatus.padEnd(13)} │ ${blogNote.padEnd(22)} ║`);
    
    // Kurzy
    const coursesStatus = courses.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const coursesNote = courses.length > 0 ? `${metadata.stats.modules} modulů` : 'Žádné';
    console.log(`║ 📚 Kurzy               │ ${courses.length.toString().padEnd(8)} │ ${coursesStatus.padEnd(13)} │ ${coursesNote.padEnd(22)} ║`);
    
    // Moduly
    const modulesStatus = metadata.stats.modules > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const modulesNote = metadata.stats.modules > 0 ? 'Vnořené v kurzech' : 'Žádné';
    console.log(`║ 🗂️  Moduly              │ ${metadata.stats.modules.toString().padEnd(8)} │ ${modulesStatus.padEnd(13)} │ ${modulesNote.padEnd(22)} ║`);
    
    // Lekce
    const lessonsStatus = metadata.stats.lessons > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const lessonsNote = metadata.stats.lessons > 0 ? 'Vnořené v modulech' : 'Žádné';
    console.log(`║ 🎥 Lekce               │ ${metadata.stats.lessons.toString().padEnd(8)} │ ${lessonsStatus.padEnd(13)} │ ${lessonsNote.padEnd(22)} ║`);
    
    // Materiály
    const materialsCount = courses.reduce((sum, course) => 
      sum + course.modules.reduce((sum, module) => 
        sum + module.lessons.reduce((sum, lesson) => sum + lesson.materials.length, 0), 0), 0);
    const materialsStatus = materialsCount > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const materialsNote = materialsCount > 0 ? 'Vnořené v lekcích' : 'Žádné';
    console.log(`║ 📎 Materiály           │ ${materialsCount.toString().padEnd(8)} │ ${materialsStatus.padEnd(13)} │ ${materialsNote.padEnd(22)} ║`);
    
    // Uživatelé
    const usersStatus = users.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const usersNote = users.length > 0 ? `${adminCount} admin(ů)` : 'Žádní';
    console.log(`║ 👥 Uživatelé           │ ${users.length.toString().padEnd(8)} │ ${usersStatus.padEnd(13)} │ ${usersNote.padEnd(22)} ║`);
    
    // Přístupy ke kurzům
    const accessStatus = userCourses.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const accessNote = userCourses.length > 0 ? 'Uživatel-kurz páry' : 'Žádné';
    console.log(`║ 🔑 Přístupy ke kurzům  │ ${userCourses.length.toString().padEnd(8)} │ ${accessStatus.padEnd(13)} │ ${accessNote.padEnd(22)} ║`);
    
    // Pokrok v lekcích
    const progressStatus = userLessonProgress.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const progressNote = userLessonProgress.length > 0 ? 'Dokončené lekce' : 'Žádný pokrok';
    console.log(`║ 📈 Pokrok v lekcích    │ ${userLessonProgress.length.toString().padEnd(8)} │ ${progressStatus.padEnd(13)} │ ${progressNote.padEnd(22)} ║`);
    
    // Auth tokeny
    const tokensStatus = authTokens.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const tokensNote = authTokens.length > 0 ? 'Aktivní tokeny' : 'Žádné tokeny';
    console.log(`║ 🔐 Auth tokeny         │ ${authTokens.length.toString().padEnd(8)} │ ${tokensStatus.padEnd(13)} │ ${tokensNote.padEnd(22)} ║`);
    
    console.log('╠════════════════════════╪══════════╪═══════════════╪════════════════════════╣');
    
    // Celkové statistiky
    const totalRecords = blogPosts.length + courses.length + metadata.stats.modules + 
                        metadata.stats.lessons + materialsCount + users.length + 
                        userCourses.length + userLessonProgress.length + authTokens.length;
    console.log(`║ 📊 CELKEM ZÁZNAMŮ      │ ${totalRecords.toString().padEnd(8)} │ ✅ KOMPLETNÍ  │ Všechna data           ║`);
    
    console.log('╚════════════════════════╧══════════╧═══════════════╧════════════════════════╝');
    
    // Detailní ukázky obsahu
    console.log('\n📋 UKÁZKY OBSAHU:');
    console.log('─'.repeat(80));
    
    if (blogPosts.length > 0) {
      console.log(`📝 Blog posty (ukázka z ${blogPosts.length}):`);
      blogPosts.slice(0, 2).forEach((post, index) => {
        const videoIcon = post.videoUrl ? '🎥' : '📄';
        console.log(`   ${videoIcon} ${post.title}`);
      });
      if (blogPosts.length > 2) console.log(`   ... a dalších ${blogPosts.length - 2}`);
    }
    
    if (courses.length > 0) {
      console.log(`\n📚 Kurzy (ukázka z ${courses.length}):`);
      courses.slice(0, 2).forEach((course, index) => {
        console.log(`   📖 ${course.title} (${course.modules.length}M/${course.modules.reduce((s,m) => s + m.lessons.length, 0)}L)`);
      });
      if (courses.length > 2) console.log(`   ... a dalších ${courses.length - 2}`);
    }
    
    if (users.length > 0) {
      console.log(`\n👥 Uživatelé:`);
      users.forEach(user => {
        const icon = user.role === 'ADMIN' ? '👑' : '👤';
        console.log(`   ${icon} ${user.email}`);
      });
    }
    
    console.log('─'.repeat(80));
    console.log('✅ Záloha dokončena!');
    console.log('\n📋 Pro nahrání na GitHub použij:');
    console.log('   git add .');
    console.log('   git commit -m "Záloha databáze"');
    console.log('   git push origin main');
    console.log('\n💡 Nebo použij: git add . && git commit -m "Záloha databáze" && git push origin main');
    
  } catch (error) {
    console.error('❌ Chyba při zálohování:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Spuštění skriptu
backupDatabase();
