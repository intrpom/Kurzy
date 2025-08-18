import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import logger from '@/utils/logger';

export async function POST(req: NextRequest) {
  try {
    // Kontrola autorizace pomocí vlastního autentizačního systému
    const session = await verifySession(req);
    if (!session || session.role !== 'admin') {
      logger.warn('Pokus o obnovení databáze bez administrátorských práv', { userId: session?.userId });
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }

    // Získání dat ze zálohy
    const backupData = await req.json();
    
    if (!backupData || !backupData.data) {
      return NextResponse.json({ error: 'Neplatná data zálohy' }, { status: 400 });
    }
    
    // Definice typu pro data zálohy
    interface BackupData {
      timestamp: string;
      data: {
        users?: any[];
        courses?: any[];
        modules?: any[];
        lessons?: any[];
        materials?: any[];
        userCourses?: any[];
        authTokens?: any[];
      };
    }
    
    logger.info('Začínám obnovení databáze ze zálohy', { timestamp: (backupData as BackupData).timestamp });
    
    // Definice typů pro statistiky
    interface DetailStats {
      total: number;
      updated: number;
      errors: number;
    }
    
    interface RestoreStats {
      processed: number;
      errors: number;
      details: {
        courses?: DetailStats;
        modules?: DetailStats;
        lessons?: DetailStats;
        materials?: DetailStats;
        users?: DetailStats;
        userCourses?: DetailStats;
        [key: string]: DetailStats | undefined;
      };
    }
    
    // Statistiky obnovení
    const stats: RestoreStats = {
      processed: 0,
      errors: 0,
      details: {}
    };
    
    // Transakce pro zajištění integrity dat
    const result = await prisma.$transaction(async (tx) => {
      // Obnovení dat - pouze aktualizace existujících záznamů
      // Poznámka: Neprovádíme úplné přepsání databáze, pouze aktualizujeme existující záznamy
      
      // Aktualizace kurzů
      if ((backupData as BackupData).data.courses && Array.isArray((backupData as BackupData).data.courses)) {
        stats.details.courses = { total: (backupData as BackupData).data.courses!.length, updated: 0, errors: 0 };
        
        for (const course of (backupData as BackupData).data.courses!) {
          try {
            // Kontrola, zda kurz existuje
            const existingCourse = await tx.course.findUnique({
              where: { id: course.id }
            });
            
            if (existingCourse) {
              await tx.course.update({
                where: { id: course.id },
                data: {
                  title: course.title,
                  subtitle: course.subtitle,
                  description: course.description,
                  imageUrl: course.imageUrl,
                  price: course.price,
                  isFeatured: course.isFeatured,
                  level: course.level,
                  tags: course.tags
                }
              });
              stats.details.courses.updated++;
            }
          } catch (error) {
            logger.error('Chyba při obnovení kurzu', { courseId: course.id, error });
            stats.details.courses.errors++;
            stats.errors++;
          }
        }
        
        stats.processed += stats.details.courses.updated;
      }
      
      // Aktualizace modulů
      if ((backupData as BackupData).data.modules && Array.isArray((backupData as BackupData).data.modules)) {
        stats.details.modules = { total: (backupData as BackupData).data.modules!.length, updated: 0, errors: 0 };
        
        for (const module of (backupData as BackupData).data.modules!) {
          try {
            // Kontrola, zda modul existuje
            const existingModule = await tx.module.findUnique({
              where: { id: module.id }
            });
            
            if (existingModule) {
              await tx.module.update({
                where: { id: module.id },
                data: {
                  title: module.title,
                  description: module.description,
                  order: module.order
                }
              });
              stats.details.modules.updated++;
            }
          } catch (error) {
            logger.error('Chyba při obnovení modulu', { moduleId: module.id, error });
            stats.details.modules.errors++;
            stats.errors++;
          }
        }
        
        stats.processed += stats.details.modules.updated;
      }
      
      // Aktualizace lekcí
      if ((backupData as BackupData).data.lessons && Array.isArray((backupData as BackupData).data.lessons)) {
        stats.details.lessons = { total: (backupData as BackupData).data.lessons!.length, updated: 0, errors: 0 };
        
        for (const lesson of (backupData as BackupData).data.lessons!) {
          try {
            // Kontrola, zda lekce existuje
            const existingLesson = await tx.lesson.findUnique({
              where: { id: lesson.id }
            });
            
            if (existingLesson) {
              await tx.lesson.update({
                where: { id: lesson.id },
                data: {
                  title: lesson.title,
                  description: lesson.description,
                  duration: lesson.duration,
                  videoUrl: lesson.videoUrl,
                  order: lesson.order
                }
              });
              stats.details.lessons.updated++;
            }
          } catch (error) {
            logger.error('Chyba při obnovení lekce', { lessonId: lesson.id, error });
            stats.details.lessons.errors++;
            stats.errors++;
          }
        }
        
        stats.processed += stats.details.lessons.updated;
      }
      
      return stats;
    });
    
    logger.info('Obnovení databáze dokončeno', { 
      processed: stats.processed,
      errors: stats.errors
    });
    
    return NextResponse.json({
      success: true,
      message: 'Databáze byla částečně obnovena ze zálohy',
      timestamp: new Date().toISOString(),
      stats: stats
    });
    
  } catch (error) {
    logger.error('Chyba při obnovení databáze:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při obnovení databáze' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
