import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess, createForbiddenResponse } from '@/lib/admin-auth';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Kontrola admin oprávnění
    const hasAdminAccess = await verifyAdminAccess(req);
    if (!hasAdminAccess) {
      logger.warn('Pokus o zálohování bez administrátorských práv');
      return createForbiddenResponse('Nemáte oprávnění k zálohování');
    }

    logger.info('Začínám proces zálohování databáze');
    
    // Diagnostika připojení k databázi
    logger.info('Kontrola připojení k databázi');
    try {
      // Pokus o získání databázové URL (bez citlivých údajů)
      const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
      if (databaseUrl) {
        try {
          const urlObj = new URL(databaseUrl);
          logger.info(`Používám databázovou URL: ${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`);
        } catch (e) {
          logger.warn('Nepodařilo se parsovat databázovou URL');
        }
      } else {
        logger.warn('Databázová URL není nastavena!');
      }
      
      // Test připojení k databázi
      logger.info('Test připojení k databázi...');
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      logger.info(`Výsledek testu připojení: ${JSON.stringify(result)}`);
    } catch (dbError) {
      logger.error('Chyba při testování připojení k databázi:', dbError);
      return NextResponse.json(
        { error: 'Nepodařilo se připojit k databázi', details: String(dbError) },
        { status: 500 }
      );
    }
    
    // Získání dat z databáze podle schématu - postupné načítání pro lepší diagnostiku
    logger.info('Načítám uživatele...');
    let users: any[] = [];
    try {
      users = await prisma.user.findMany();
      logger.info(`Načteno ${users.length} uživatelů`);
    } catch (error) {
      logger.error('Chyba při načítání uživatelů:', error);
    }
    
    logger.info('Načítám kurzy...');
    let courses: any[] = [];
    try {
      courses = await prisma.course.findMany();
      logger.info(`Načteno ${courses.length} kurzů`);
    } catch (error) {
      logger.error('Chyba při načítání kurzů:', error);
    }
    
    logger.info('Načítám moduly...');
    let modules: any[] = [];
    try {
      modules = await prisma.module.findMany();
      logger.info(`Načteno ${modules.length} modulů`);
    } catch (error) {
      logger.error('Chyba při načítání modulů:', error);
    }
    
    logger.info('Načítám lekce...');
    let lessons: any[] = [];
    try {
      lessons = await prisma.lesson.findMany();
      logger.info(`Načteno ${lessons.length} lekcí`);
    } catch (error) {
      logger.error('Chyba při načítání lekcí:', error);
    }
    
    logger.info('Načítám materiály...');
    let materials: any[] = [];
    try {
      materials = await prisma.material.findMany();
      logger.info(`Načteno ${materials.length} materiálů`);
    } catch (error) {
      logger.error('Chyba při načítání materiálů:', error);
    }
    
    logger.info('Načítám přístupy ke kurzům...');
    let userCourses: any[] = [];
    try {
      userCourses = await prisma.userCourse.findMany();
      logger.info(`Načteno ${userCourses.length} přístupů ke kurzům`);
    } catch (error) {
      logger.error('Chyba při načítání přístupů ke kurzům:', error);
    }
    
    logger.info('Načítám autentizační tokeny...');
    let authTokens: any[] = [];
    try {
      authTokens = await prisma.authToken.findMany();
      logger.info(`Načteno ${authTokens.length} autentizačních tokenů`);
    } catch (error) {
      logger.error('Chyba při načítání autentizačních tokenů:', error);
    }
    
    // Logování počtu načtených záznamů
    logger.info(`Načteno ${users.length} uživatelů`);
    logger.info(`Načteno ${courses.length} kurzů`);
    logger.info(`Načteno ${modules.length} modulů`);
    logger.info(`Načteno ${lessons.length} lekcí`);
    logger.info(`Načteno ${materials.length} materiálů`);
    logger.info(`Načteno ${userCourses.length} přístupů ke kurzům`);
    logger.info(`Načteno ${authTokens.length} autentizačních tokenů`);

    // Vytvoření složky pro zálohy (pouze v development prostředí)
    const isDevelopment = process.env.NODE_ENV === 'development';
    let backupDir = '';
    let currentBackupDir = '';
    
    if (isDevelopment) {
      try {
        backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Vytvoření složky s časovým razítkem pro tuto zálohu
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        currentBackupDir = path.join(backupDir, `backup-${timestamp}`);
        fs.mkdirSync(currentBackupDir);
        
        logger.info(`Zálohuji do složky: ${currentBackupDir}`);
      } catch (fsError) {
        logger.warn('Nepodařilo se vytvořit složku pro zálohy (běží na Vercel?)', fsError);
      }
    }

    // Vytvoření objektu zálohy
    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        courses,
        modules,
        lessons,
        materials,
        userCourses,
        authTokens,
      }
    };

    // Vytvoření názvu souboru s časovým razítkem
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const fileName = `backup-${timestamp}.json`;

    // Uložení souborů (pouze v development prostředí)
    if (isDevelopment && currentBackupDir) {
      try {
        // Uložení jednotlivých souborů jako v původním skriptu
        fs.writeFileSync(
          path.join(currentBackupDir, 'users.json'),
          JSON.stringify(users, null, 2)
        );
        
        fs.writeFileSync(
          path.join(currentBackupDir, 'courses.json'),
          JSON.stringify(courses, null, 2)
        );
        
        fs.writeFileSync(
          path.join(currentBackupDir, 'user-courses.json'),
          JSON.stringify(userCourses, null, 2)
        );
        
        // Vytvoření souboru s metadaty zálohy
        const metadata = {
          timestamp: new Date().toISOString(),
          stats: {
            courses: courses.length,
            modules: modules.length,
            lessons: lessons.length,
            users: users.length,
            userCourses: userCourses.length,
            materials: materials.length,
            authTokens: authTokens.length,
          }
        };
        
        fs.writeFileSync(
          path.join(currentBackupDir, 'metadata.json'),
          JSON.stringify(metadata, null, 2)
        );
        
        logger.info(`✅ Záloha uložena do: ${currentBackupDir}`);
      } catch (fsError) {
        logger.error('Chyba při ukládání souborů zálohy:', fsError);
      }
    }

    logger.info(`Záloha úspěšně vytvořena: ${fileName}`);

    // Vrácení odpovědi s informacemi o záloze
    return NextResponse.json({
      success: true,
      timestamp: backupData.timestamp,
      fileName,
      backupDir: isDevelopment ? currentBackupDir : null,
      stats: {
        users: users.length,
        courses: courses.length,
        modules: modules.length,
        lessons: lessons.length,
        materials: materials.length,
        userCourses: userCourses.length,
        authTokens: authTokens.length,
      },
      // V produkci (Vercel) vrátíme data pro stažení, v development ne (jsou už uložena)
      data: isDevelopment ? null : backupData.data
    });
  } catch (error) {
    logger.error('Chyba při zálohování databáze:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při zálohování databáze' },
      { status: 500 }
    );
  }
}
