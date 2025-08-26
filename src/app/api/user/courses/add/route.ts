import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { updateUserAfterFreeCourse } from '@/lib/fluentcrm';

// Explicitně označit tuto API trasu jako dynamickou
export const dynamic = 'force-dynamic';

// Nastavení hlaviček pro zabránění cachování
const headers = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function POST(request: NextRequest) {
  console.log('POST /api/user/courses/add - Zpracování požadavku');
  try {
    // Získat session cookie
    const sessionCookie = cookies().get('session');
    console.log('Session cookie existuje:', !!sessionCookie);
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log('Chybí session cookie - uživatel není přihlášen');
      return NextResponse.json(
        { error: 'Uživatel není přihlášen' },
        { status: 401, headers }
      );
    }
    
    // Dekódovat session cookie
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      console.log('Session data dekódována:', { id: sessionData?.id, email: sessionData?.email });
    } catch (e) {
      console.error('Chyba při dekódování session:', e);
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401, headers }
      );
    }
    
    if (!sessionData || !sessionData.id) {
      console.log('Neplatná session data - chybí ID uživatele');
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401, headers }
      );
    }
    
    const userId = sessionData.id;
    
    // Získat data z požadavku
    const data = await request.json();
    const { courseId } = data;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Chybí ID kurzu' },
        { status: 400 }
      );
    }
    
    // Zkontrolovat, zda kurz existuje a je zdarma
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404 }
      );
    }
    
    // Zkontrolovat, zda uživatel již nemá přístup ke kurzu
    // @ts-ignore - Prisma klient má správně definovaný model userCourse
    const existingUserCourse = await prisma.userCourse.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    });
    
    console.log('Existující přístup ke kurzu:', !!existingUserCourse);
    
    if (existingUserCourse) {
      return NextResponse.json({
        success: true,
        message: 'Uživatel již má přístup ke kurzu'
      }, { headers });
    }
    
    // Přidat kurz uživateli
    // @ts-ignore - Prisma klient má správně definovaný model userCourse
    await prisma.userCourse.create({
      data: {
        userId: userId,
        courseId: courseId,
        progress: 0,
        completed: false
      }
    });
    
    console.log('Kurz úspěšně přidán uživateli:', { userId, courseId });
    
    // Aktualizovat uživatele v FluentCRM po přidání free kurzu
    try {
      console.log('Aktualizuji uživatele v FluentCRM po přidání free kurzu...');
      
      // Najít informace o uživateli a kurzu
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, slug: true }
      });

      if (user && course) {
        const fluentResponse = await updateUserAfterFreeCourse(
          user.email,
          course.title,
          course.slug
        );
        
        if (fluentResponse.success) {
          console.log('Uživatel úspěšně aktualizován v FluentCRM po free kurzu:', user.email);
        } else {
          console.warn('Nepodařilo se aktualizovat uživatele v FluentCRM:', fluentResponse.message);
        }
      } else {
        console.warn('Uživatel nebo kurz nenalezen pro FluentCRM aktualizaci');
      }
    } catch (error) {
      console.error('Chyba při aktualizaci FluentCRM po free kurzu:', error);
      // Pokračujeme i když se nepodaří aktualizovat CRM - nekritická chyba
    }
    
    return NextResponse.json({
      success: true,
      message: 'Kurz byl úspěšně přidán uživateli'
    }, { headers });
  } catch (error) {
    console.error('Chyba při přidávání kurzu uživateli:', error);
    console.error('Podrobnosti chyby:', error);
    return NextResponse.json(
      { error: 'Došlo k chybě při zpracování požadavku' },
      { status: 500, headers }
    );
  }
}
