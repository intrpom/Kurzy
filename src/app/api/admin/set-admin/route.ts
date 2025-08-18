import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import logger from '@/utils/logger';

// Vytvoříme instanci Prisma klienta
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Kontrola autorizace pomocí vlastního autentizačního systému
    const session = await verifySession(req);
    if (!session) {
      logger.warn('Pokus o nastavení admin role bez přihlášení');
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }
    
    // Nastavení role admin pro aktuálního uživatele
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { role: 'admin' }
    });
    
    logger.info(`Uživatel ${updatedUser.email} byl nastaven jako admin`);
    
    return NextResponse.json({
      success: true,
      message: `Role admin byla nastavena pro uživatele ${updatedUser.email}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    logger.error('Chyba při nastavování admin role:', error);
    return NextResponse.json(
      { error: 'Nastala chyba při nastavování admin role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
