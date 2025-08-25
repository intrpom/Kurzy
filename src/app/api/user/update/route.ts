import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * PATCH /api/user/update - Aktualizace údajů uživatele
 */
export async function PATCH(request: NextRequest) {
  try {
    // Ověření přihlášení
    const userSession = await verifySession(request);
    
    if (!userSession) {
      return NextResponse.json(
        { error: 'Musíte být přihlášeni' },
        { status: 401 }
      );
    }

    const userId = userSession.userId;

    // Získání dat z požadavku
    const body = await request.json();
    const { name } = body;

    // Validace dat
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { error: 'Jméno musí být text' },
          { status: 400 }
        );
      }
      
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Jméno je příliš dlouhé (maximum 100 znaků)' },
          { status: 400 }
        );
      }
    }

    console.log(`Aktualizace údajů uživatele ${userSession.email} (${userId}):`, { name });

    // Aktualizace v databázi
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...(name !== undefined && { name: name.trim() || null })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log(`Uživatel ${userSession.email} byl úspěšně aktualizován:`, updatedUser);

    return NextResponse.json({
      message: 'Údaje byly úspěšně aktualizovány',
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('Chyba při aktualizaci uživatele:', error);
    return NextResponse.json(
      { error: 'Chyba při aktualizaci údajů' },
      { status: 500 }
    );
  }
}
