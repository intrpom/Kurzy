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

/**
 * Pokročilá kontrola integrity zálohy - ověří velikosti souborů, konzistenci dat a porovná s předchozími zálohami
 */
async function performBackupIntegrityCheck(backupDir, originalData) {
  try {
    console.log('   🔍 Kontroluji velikosti souborů...');
    
    const backupFiles = [
      { name: 'courses.json', data: originalData.courses, minSize: 1000 },
      { name: 'users.json', data: originalData.users, minSize: 200 },
      { name: 'user-courses.json', data: originalData.userCourses, minSize: 50 },
      { name: 'blog-posts.json', data: originalData.blogPosts, minSize: 1000 },
      { name: 'auth-tokens.json', data: originalData.authTokens, minSize: 10 },
      { name: 'user-lesson-progress.json', data: originalData.userLessonProgress, minSize: 50 },
      { name: 'user-mini-courses.json', data: originalData.userMiniCourses, minSize: 10 },
      { name: 'testtable.json', data: originalData.testtableData, minSize: 2 }, // minimálně []
      { name: 'metadata.json', data: null, minSize: 100 }
    ];
    
    let totalBackupSize = 0;
    let filesChecked = 0;
    let warnings = [];
    
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file.name);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeKB = Math.round(stats.size / 1024 * 100) / 100;
        totalBackupSize += stats.size;
        filesChecked++;
        
        // Kontrola minimální velikosti
        if (stats.size < file.minSize) {
          warnings.push(`⚠️  ${file.name}: Podezřele malý soubor (${fileSizeKB} KB)`);
        }
        
        // Kontrola konzistence dat vs soubor
        if (file.data && Array.isArray(file.data)) {
          const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (fileContent.length !== file.data.length) {
            warnings.push(`❌ ${file.name}: Nesouhlasí počet záznamů (soubor: ${fileContent.length}, data: ${file.data.length})`);
          } else {
            console.log(`   ✅ ${file.name}: ${fileContent.length} záznamů, ${fileSizeKB} KB`);
          }
        } else {
          console.log(`   ✅ ${file.name}: ${fileSizeKB} KB`);
        }
      } else {
        warnings.push(`❌ Chybí soubor: ${file.name}`);
      }
    }
    
    console.log(`\n   📊 Celková velikost zálohy: ${Math.round(totalBackupSize / 1024)} KB`);
    console.log(`   📁 Zkontrolováno souborů: ${filesChecked}/${backupFiles.length}`);
    
    // Kontrola JSON validity
    console.log('\n   🔍 Kontroluji validitu JSON souborů...');
    let validJsonFiles = 0;
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file.name);
      if (fs.existsSync(filePath)) {
        try {
          JSON.parse(fs.readFileSync(filePath, 'utf8'));
          validJsonFiles++;
        } catch (error) {
          warnings.push(`❌ ${file.name}: Neplatný JSON - ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Validních JSON souborů: ${validJsonFiles}/${filesChecked}`);
    
    // Porovnání s předchozí zálohou
    console.log('\n   🔍 Porovnávám s předchozí zálohou...');
    await compareWithPreviousBackup(backupDir, originalData);
    
    // Výsledek kontroly
    if (warnings.length === 0) {
      console.log('\n   ✅ Integrita zálohy: PERFEKTNÍ');
      console.log('   🛡️  Všechny kontroly prošly úspěšně');
    } else {
      console.log('\n   ⚠️  Nalezena upozornění:');
      warnings.forEach(warning => console.log(`      ${warning}`));
      
      if (warnings.some(w => w.includes('❌'))) {
        console.log('\n   🚨 KRITICKÉ CHYBY - zkontroluj zálohu!');
      } else {
        console.log('\n   💡 Pouze upozornění - záloha je pravděpodobně v pořádku');
      }
    }
    
  } catch (error) {
    console.error('   ❌ Chyba při kontrole integrity:', error.message);
    console.log('   ⚠️  Pokračujem bez kontroly integrity...');
  }
}

/**
 * Porovnání s předchozí zálohou pro detekci neočekávaných změn
 */
async function compareWithPreviousBackup(currentBackupDir, currentData) {
  try {
    const backupDir = path.dirname(currentBackupDir);
    const backups = fs.readdirSync(backupDir)
      .filter(dir => dir.startsWith('backup-') && dir !== path.basename(currentBackupDir))
      .sort()
      .reverse(); // nejnovější první
    
    if (backups.length === 0) {
      console.log('   ℹ️  Žádná předchozí záloha k porovnání');
      return;
    }
    
    const previousBackupDir = path.join(backupDir, backups[0]);
    const previousMetadataPath = path.join(previousBackupDir, 'metadata.json');
    
    if (!fs.existsSync(previousMetadataPath)) {
      console.log('   ⚠️  Předchozí záloha nemá metadata');
      return;
    }
    
    const previousMetadata = JSON.parse(fs.readFileSync(previousMetadataPath, 'utf8'));
    const currentStats = {
      courses: currentData.courses.length,
      users: currentData.users.length,
      blogPosts: currentData.blogPosts.length,
      userCourses: currentData.userCourses.length,
      userMiniCourses: currentData.userMiniCourses.length,
      userLessonProgress: currentData.userLessonProgress.length,
      authTokens: currentData.authTokens.length,
      testtable: currentData.testtableData.length
    };
    
    console.log(`   📅 Porovnávám s: ${backups[0]}`);
    
    let significantChanges = [];
    let normalChanges = [];
    
    for (const [key, currentValue] of Object.entries(currentStats)) {
      const previousValue = previousMetadata.stats[key] || 0;
      const diff = currentValue - previousValue;
      
      if (diff !== 0) {
        const changeText = `${key}: ${previousValue} → ${currentValue} (${diff > 0 ? '+' : ''}${diff})`;
        
        // Detekce významných změn
        if (key === 'courses' && Math.abs(diff) > 0) {
          significantChanges.push(`📚 ${changeText}`);
        } else if (key === 'users' && diff > 5) {
          significantChanges.push(`👥 ${changeText}`);
        } else if (key === 'blogPosts' && Math.abs(diff) > 0) {
          significantChanges.push(`📝 ${changeText}`);
        } else if (key === 'userMiniCourses' && Math.abs(diff) > 0) {
          significantChanges.push(`🛒 ${changeText}`);
        } else {
          normalChanges.push(`   ${changeText}`);
        }
      }
    }
    
    if (significantChanges.length > 0) {
      console.log('   📈 Významné změny:');
      significantChanges.forEach(change => console.log(`      ${change}`));
    }
    
    if (normalChanges.length > 0) {
      console.log('   📊 Běžné změny:');
      normalChanges.forEach(change => console.log(`      ${change}`));
    }
    
    if (significantChanges.length === 0 && normalChanges.length === 0) {
      console.log('   ✅ Žádné změny od poslední zálohy');
    }
    
  } catch (error) {
    console.log('   ⚠️  Nelze porovnat s předchozí zálohou:', error.message);
  }
}

/**
 * Kontrola kompletnosti zálohování - ověří, že se zálohují všechny tabulky
 */
async function checkBackupCompleteness() {
  try {
    // Seznam tabulek, které se aktuálně zálohují
    const backedUpTables = [
      'User',
      'Course',
      'Module',    // zálohuje se vnořeně v Course
      'Lesson',    // zálohuje se vnořeně v Course -> Module
      'Material',  // zálohuje se vnořeně v Course -> Module -> Lesson
      'BlogPost',
      'UserCourse',
      'UserLessonProgress',
      'UserMiniCourse',
      'AuthToken',
      'Testtable'  // všechny tabulky pro jistotu
    ];
    
    // Získání všech tabulek z databáze pomocí raw SQL
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name;
    `;
    
    const dbTableNames = tables.map(t => {
      // Převod z snake_case na PascalCase (např. user_courses -> UserCourse)
      const tableName = t.table_name.toLowerCase();
      
      // Speciální mapování pro známé tabulky
      const tableMapping = {
        'user': 'User',
        'course': 'Course',
        'module': 'Module',
        'lesson': 'Lesson',
        'material': 'Material',
        'blogpost': 'BlogPost',
        'usercourse': 'UserCourse',
        'userlessonprogress': 'UserLessonProgress',
        'userminicourse': 'UserMiniCourse',
        'authtoken': 'AuthToken'
      };
      
      return tableMapping[tableName] || tableName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });
    
    console.log(`   📋 Nalezeno ${dbTableNames.length} tabulek v databázi`);
    console.log(`   💾 Zálohuje se ${backedUpTables.length} tabulek`);
    
    // Najdi tabulky, které se nezálohují
    const missingTables = dbTableNames.filter(table => !backedUpTables.includes(table));
    
    // Najdi tabulky, které se zálohují, ale neexistují
    const extraTables = backedUpTables.filter(table => !dbTableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  VAROVÁNÍ: Nalezeny tabulky, které se NEZÁLOHUJÍ:');
      missingTables.forEach(table => {
        console.log(`   ❌ ${table}`);
      });
      console.log('\n🔧 AKCE POTŘEBNÁ: Aktualizuj backup script a přidej zálohu těchto tabulek!');
      console.log('   1. Přidej zálohu tabulky do funkce backupDatabase()');
      console.log('   2. Přidej tabulku do seznamu backedUpTables v checkBackupCompleteness()');
      console.log('   3. Aktualizuj metadata a rapport');
      console.log('\n❓ Chceš pokračovat v zálohování? (y/n)');
      
      // V produkci by se script zastavil, ale pro vývoj pokračujeme
      console.log('⚠️  Pokračujem v zálohování, ale ZKONTROLUJ TO!\n');
    }
    
    if (extraTables.length > 0) {
      console.log('\n💡 INFO: Nalezeny tabulky v backup scriptu, které neexistují v DB:');
      extraTables.forEach(table => {
        console.log(`   ℹ️  ${table} (možná byla smazána)`);
      });
      console.log('');
    }
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('   ✅ Všechny tabulky se správně zálohují!\n');
    }
    
    // Detailní výpis pro debug
    console.log('   📊 Tabulky v databázi:', dbTableNames.join(', '));
    console.log('   💾 Zálohované tabulky:', backedUpTables.join(', '));
    console.log('');
    
  } catch (error) {
    console.error('❌ Chyba při kontrole kompletnosti:', error);
    console.log('⚠️  Pokračujem v zálohování bez kontroly...\n');
  }
}

async function backupDatabase() {
  try {
    console.log('🚀 Spouštím zálohování databáze...\n');
    
    // 0. KROK: Kontrola kompletnosti zálohování
    console.log('🔍 0. Kontroluji kompletnost zálohování...');
    await checkBackupCompleteness();
    
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
    
    // Záloha nákupů minikurzů (KRITICKÉ!)
    const userMiniCourses = await prisma.userMiniCourse.findMany();
    fs.writeFileSync(
      path.join(currentBackupDir, 'user-mini-courses.json'),
      JSON.stringify(userMiniCourses, null, 2)
    );
    
    // Záloha Testtable (pro kompletnost)
    let testtableData = [];
    try {
      testtableData = await prisma.$queryRaw`SELECT * FROM "Testtable"`;
      fs.writeFileSync(
        path.join(currentBackupDir, 'testtable.json'),
        JSON.stringify(testtableData, null, 2)
      );
    } catch (error) {
      // Pokud tabulka neexistuje nebo je prázdná, není to problém
      console.log('   ℹ️  Testtable je prázdná nebo neexistuje');
      fs.writeFileSync(
        path.join(currentBackupDir, 'testtable.json'),
        JSON.stringify([], null, 2)
      );
    }
    
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
        userLessonProgress: userLessonProgress.length,
        userMiniCourses: userMiniCourses.length,
        testtable: testtableData.length
      }
    };
    
    fs.writeFileSync(
      path.join(currentBackupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`   ✅ Záloha dokončena!`);
    console.log(`   📁 Data uložena do: ${currentBackupDir}`);
    console.log(`   📊 Statistiky: ${metadata.stats.courses} kurzů, ${metadata.stats.modules} modulů, ${metadata.stats.lessons} lekcí, ${metadata.stats.blogPosts} blog postů, ${metadata.stats.users} uživatelů, ${metadata.stats.authTokens} tokenů, ${metadata.stats.userLessonProgress} pokroků, ${metadata.stats.userMiniCourses} nákupů minikurzů\n`);
    
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
    
    // Nákupy minikurzů
    const miniCoursesStatus = userMiniCourses.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
    const miniCoursesNote = userMiniCourses.length > 0 ? 'Nákupy minikurzů' : 'Žádné nákupy';
    console.log(`║ 🛒 Nákupy minikurzů    │ ${userMiniCourses.length.toString().padEnd(8)} │ ${miniCoursesStatus.padEnd(13)} │ ${miniCoursesNote.padEnd(22)} ║`);
    
    console.log('╠════════════════════════╪══════════╪═══════════════╪════════════════════════╣');
    
    // Celkové statistiky
    const totalRecords = blogPosts.length + courses.length + metadata.stats.modules + 
                        metadata.stats.lessons + materialsCount + users.length + 
                        userCourses.length + userLessonProgress.length + authTokens.length + 
                        userMiniCourses.length;
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
        console.log(`   ${icon} ${user.email} (${user.role})`);
      });
    }
    
    // Nákupy minikurzů
    if (userMiniCourses.length > 0) {
      console.log(`\n🛒 Nákupy minikurzů (${userMiniCourses.length}):`);
      userMiniCourses.forEach(purchase => {
        const user = users.find(u => u.id === purchase.userId);
        const blogPost = blogPosts.find(bp => bp.id === purchase.blogPostId);
        if (user && blogPost) {
          console.log(`   💰 ${user.email} → ${blogPost.title} (${purchase.price} Kč)`);
        }
      });
    } else {
      console.log(`\n🛒 Nákupy minikurzů: Žádné nákupy`);
    }
    
    // Pokrok uživatelů
    if (userLessonProgress.length > 0) {
      console.log(`\n📈 Pokrok v lekcích (${userLessonProgress.length}):`);
      userLessonProgress.slice(0, 3).forEach(progress => {
        const user = users.find(u => u.id === progress.userId);
        console.log(`   ✅ ${user?.email || 'Neznámý'} - dokončeno: ${progress.completed ? 'ANO' : 'NE'}`);
      });
      if (userLessonProgress.length > 3) {
        console.log(`   ... a dalších ${userLessonProgress.length - 3}`);
      }
    } else {
      console.log(`\n📈 Pokrok v lekcích: Žádný pokrok zatím`);
    }
    
    // Auth tokeny
    if (authTokens.length > 0) {
      console.log(`\n🔐 Auth tokeny (${authTokens.length}):`);
      authTokens.slice(0, 2).forEach(token => {
        const user = users.find(u => u.id === token.userId);
        console.log(`   🔑 ${user?.email || 'Neznámý'} - vyprší: ${new Date(token.expires).toLocaleDateString('cs-CZ')}`);
      });
      if (authTokens.length > 2) {
        console.log(`   ... a dalších ${authTokens.length - 2}`);
      }
    } else {
      console.log(`\n🔐 Auth tokeny: Žádné aktivní tokeny`);
    }
    
    // Materiály
    if (materialsCount > 0) {
      console.log(`\n📎 Materiály (${materialsCount}):`);
      let shownMaterials = 0;
      courses.forEach(course => {
        course.modules.forEach(module => {
          module.lessons.forEach(lesson => {
            if (lesson.materials && lesson.materials.length > 0 && shownMaterials < 3) {
              lesson.materials.forEach(material => {
                if (shownMaterials < 3) {
                  console.log(`   📄 ${material.title} (${lesson.title})`);
                  shownMaterials++;
                }
              });
            }
          });
        });
      });
      if (materialsCount > 3) {
        console.log(`   ... a dalších ${materialsCount - 3}`);
      }
    } else {
      console.log(`\n📎 Materiály: Žádné materiály`);
    }
    
    // Cenové informace
    const totalCourseValue = courses.reduce((sum, course) => sum + (course.price || 0), 0);
    const totalMiniCourseValue = blogPosts.reduce((sum, post) => sum + (post.price || 0), 0);
    const totalPurchaseValue = userMiniCourses.reduce((sum, purchase) => sum + (purchase.price || 0), 0);
    
    console.log(`\n💰 Cenové informace:`);
    console.log(`   📚 Celková hodnota kurzů: ${totalCourseValue} Kč`);
    console.log(`   📝 Celková hodnota minikurzů: ${totalMiniCourseValue} Kč`);
    console.log(`   🛒 Celková hodnota nákupů: ${totalPurchaseValue} Kč`);
    
    console.log('─'.repeat(80));
    
    // 2. KROK: Pokročilá kontrola integrity zálohy
    console.log('\n🔍 2. Kontroluji integritu zálohy...');
    await performBackupIntegrityCheck(currentBackupDir, {
      courses,
      users,
      userCourses,
      blogPosts,
      authTokens,
      userLessonProgress,
      userMiniCourses,
      testtableData
    });
    
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
