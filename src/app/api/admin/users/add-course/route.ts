import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { updateUserAfterPurchase } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

// Nastavení hlaviček pro zabránění cachování
const headers = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function POST(request: NextRequest) {
  console.log('POST /api/admin/users/add-course - Admin přidávání kurzu uživateli');
  
  try {
    // Ověření admin session
    const sessionCookie = cookies().get('session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'Uživatel není přihlášen' },
        { status: 401, headers }
      );
    }
    
    // Dekódovat session cookie
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch (e) {
      console.error('Chyba při dekódování session:', e);
      return NextResponse.json(
        { error: 'Neplatná session' },
        { status: 401, headers }
      );
    }
    
    if (!sessionData || sessionData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nedostatečná oprávnění' },
        { status: 403, headers }
      );
    }
    
    // Získat data z požadavku
    const data = await request.json();
    const { userEmail, courseId } = data;
    
    if (!userEmail || !courseId) {
      return NextResponse.json(
        { error: 'Chybí email uživatele nebo ID kurzu' },
        { status: 400, headers }
      );
    }
    
    console.log('Admin přidává kurz:', { userEmail, courseId });
    
    // Najít uživatele podle emailu
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Uživatel s tímto emailem nebyl nalezen' },
        { status: 404, headers }
      );
    }
    
    // Zkontrolovat, zda kurz existuje
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true, price: true }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: 'Kurz nebyl nalezen' },
        { status: 404, headers }
      );
    }
    
    // Zkontrolovat, zda uživatel již nemá přístup ke kurzu
    const existingUserCourse = await prisma.userCourse.findFirst({
      where: {
        userId: user.id,
        courseId: courseId
      }
    });
    
    if (existingUserCourse) {
      return NextResponse.json(
        { error: 'Uživatel již má přístup k tomuto kurzu' },
        { status: 400, headers }
      );
    }
    
    // Přidat kurz uživateli
    await prisma.userCourse.create({
      data: {
        userId: user.id,
        courseId: courseId,
        progress: 0,
        completed: false
      }
    });
    
    console.log(`✅ Admin úspěšně přidal kurz ${course.title} uživateli ${user.email}`);
    
    // Aktualizovat uživatele v FluentCRM
    try {
      console.log('Aktualizuji uživatele v FluentCRM po manuálním přidání kurzu...');
      
      const fluentResponse = await updateUserAfterPurchase(
        user.email,
        course.title,
        course.slug
      );
      
      if (fluentResponse.success) {
        console.log('✅ Uživatel úspěšně aktualizován v FluentCRM po manuálním přidání kurzu');
      } else {
        console.warn('⚠️ Nepodařilo se aktualizovat uživatele v FluentCRM:', fluentResponse.message);
      }
    } catch (error) {
      console.error('❌ Chyba při aktualizaci FluentCRM po manuálním přidání kurzu:', error);
      // Pokračujeme i když se nepodaří aktualizovat CRM - nekritická chyba
    }
    
    return NextResponse.json({
      success: true,
      message: `Kurz "${course.title}" byl úspěšně přidán uživateli ${user.email}`,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { headers });
    
  } catch (error) {
    console.error('❌ Chyba při admin přidávání kurzu uživateli:', error);
    return NextResponse.json(
      { 
        error: 'Nepodařilo se přidat kurz uživateli',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers }
    );
  }
}
