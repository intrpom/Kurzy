import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * DELETE /api/user/delete - Smazání vlastního uživatelského účtu
 */
export async function DELETE(request: NextRequest) {
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

    console.log(`Uživatel ${userSession.email} (${userId}) požaduje smazání svého účtu`);

    // Provedeme smazání v transakci pro zachování integrity dat
    await prisma.$transaction(async (tx) => {
      // Nejdříve smažeme všechny UserCourse záznamy
      const deletedUserCourses = await tx.userCourse.deleteMany({
        where: {
          userId: userId
        }
      });
      console.log(`Smazáno ${deletedUserCourses.count} UserCourse záznamů pro uživatele ${userId}`);

      // Smažeme všechny AuthToken záznamy
      const deletedAuthTokens = await tx.authToken.deleteMany({
        where: {
          userId: userId
        }
      });
      console.log(`Smazáno ${deletedAuthTokens.count} AuthToken záznamů pro uživatele ${userId}`);

      // Nakonec smažeme samotného uživatele
      await tx.user.delete({
        where: {
          id: userId
        }
      });
      console.log(`Smazán uživatel ${userId}`);
    });

    console.log(`Účet uživatele ${userSession.email} byl úspěšně smazán`);

    // Vraťme úspěšnou odpověď
    return NextResponse.json(
      { 
        message: 'Váš účet byl úspěšně smazán',
        deletedUserId: userId 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Chyba při mazání uživatelského účtu:', error);
    return NextResponse.json(
      { error: 'Chyba při mazání účtu' },
      { status: 500 }
    );
  }
}
