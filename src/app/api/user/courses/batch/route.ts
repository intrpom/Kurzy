import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ courseAccess: {} }, { status: 200 });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
      
      // Kontrola expirace
      if (sessionData.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.json({ courseAccess: {} }, { status: 200 });
      }
    } catch (sessionError) {
      return NextResponse.json({ courseAccess: {} }, { status: 200 });
    }

    // Načíst všechny UserCourse záznamy pro tohoto uživatele
    const userCourses = await prisma.userCourse.findMany({
      where: {
        userId: sessionData.userId,
      },
      select: {
        courseId: true,
      },
    });

    // Vytvořit mapu courseId -> hasAccess
    const courseAccess: Record<string, boolean> = {};
    userCourses.forEach(uc => {
      courseAccess[uc.courseId] = true;
    });

    return NextResponse.json({ courseAccess }, { status: 200 });
  } catch (error) {
    console.error('Chyba při načítání batch přístupů ke kurzům:', error);
    return NextResponse.json(
      { message: 'Chyba při načítání přístupů ke kurzům.' },
      { status: 500 }
    );
  }
}
