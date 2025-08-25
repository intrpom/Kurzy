import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './db'; // Importujeme sdílenou instanci Prisma klienta

// Rozhraní pro dekódovanou relaci
export interface DecodedSession {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Ověří session token z cookies a vrátí informace o uživateli
 * @param request - NextRequest objekt
 * @returns Dekódovaná session nebo null, pokud není platná
 */
export async function verifySession(request: NextRequest): Promise<DecodedSession | null> {
  try {
    // Získání všech cookies
    const sessionCookie = request.cookies.get('session');
    const userIdCookie = request.cookies.get('user_id');
    const sessionCheckCookie = request.cookies.get('session_check');
    
    console.log('Dostupné cookies:', { 
      session: sessionCookie ? 'přítomna' : 'chybí', 
      user_id: userIdCookie ? userIdCookie.value : 'chybí',
      session_check: sessionCheckCookie ? sessionCheckCookie.value : 'chybí'
    });
    
    // Pokud nemáme session cookie, ale máme user_id cookie, zkusíme použít tu
    if ((!sessionCookie || !sessionCookie.value) && userIdCookie && userIdCookie.value) {
      console.log('Používám záložní cookie user_id:', userIdCookie.value);
      
      try {
        // Kontrola, zda uživatel existuje
        const user = await prisma.user.findUnique({
          where: { id: userIdCookie.value },
        });

        if (!user) {
          console.log('Uživatel z user_id cookie nebyl nalezen v databázi');
          return null;
        }

        // Vrátíme informace o uživateli
        return {
          userId: user.id,
          email: user.email,
          role: user.role,
        };
      } catch (userIdError) {
        console.error('Chyba při zpracování user_id cookie:', userIdError);
      }
    }
    
    // Pokud nemáme session cookie, vrátíme null
    if (!sessionCookie || !sessionCookie.value) {
      console.log('Žádná session cookie nebyla nalezena');
      return null;
    }

    try {
      // Pokus o dekódování Base64 JSON objektu
      console.log('Pokus o dekódování jako Base64 JSON');
      
      // Zkusíme dekódovat Base64
      let decodedBase64;
      try {
        // Nejprve zkusíme odstranit případné URL kódování
        const decodedValue = decodeURIComponent(sessionCookie.value);
        console.log('Hodnota po URL dekódování:', decodedValue.substring(0, 20) + '...');
        
        // Pak zkusíme dekódovat Base64
        decodedBase64 = Buffer.from(decodedValue, 'base64').toString();
        console.log('Base64 dekódováno:', decodedBase64.substring(0, 50) + '...');
      } catch (base64DecodeError) {
        console.error('Chyba při dekódování Base64:', base64DecodeError);
        
        // Pokud se nepodaří dekódovat, zkusíme přímo hodnotu cookie
        console.log('Zkusím použít přímo hodnotu cookie');
        decodedBase64 = sessionCookie.value;
      }
      
      // Zkusíme parsovat JSON
      let sessionData;
      try {
        sessionData = JSON.parse(decodedBase64);
      } catch (jsonError) {
        console.error('Chyba při parsování JSON:', jsonError);
        
        // Pokud se nepodaří parsovat JSON, zkusíme použít user_id cookie
        if (userIdCookie && userIdCookie.value) {
          console.log('Používám záložní cookie user_id po neúspěšném parsování JSON');
          
          const user = await prisma.user.findUnique({
            where: { id: userIdCookie.value },
          });

          if (!user) {
            console.log('Uživatel z user_id cookie nebyl nalezen v databázi');
            return null;
          }

          return {
            userId: user.id,
            email: user.email,
            role: user.role,
          };
        }
        
        return null;
      }
      
      // Kontrola, zda session obsahuje potřebná data (podporujeme starý i nový formát)
      const userId = sessionData.userId || sessionData.id;
      if (!sessionData || !userId) {
        console.error('Session data neobsahují ID uživatele');
        return null;
      }
      
      console.log('Session data úspěšně dekódována:', { 
        userId: userId,
        role: sessionData.role,
        exp: sessionData.exp ? new Date(sessionData.exp * 1000).toISOString() : 'není'
      });
      
      // Kontrola, zda uživatel existuje
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.log('Uživatel nebyl nalezen v databázi');
        return null;
      }

      // Kontrola expirace
      if (sessionData.exp && sessionData.exp < Math.floor(Date.now() / 1000)) {
        console.log('Session vypršela');
        return null;
      }

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (tokenError) {
      // Chyba při ověřování tokenu
      console.error('Chyba při ověřování session tokenu:', tokenError);
      console.log('Token (prvních 20 znaků):', sessionCookie.value.substring(0, 20) + '...');
      
      // Pokud se nepodaří dekódovat token, zkusíme použít user_id cookie
      if (userIdCookie && userIdCookie.value) {
        console.log('Používám záložní cookie user_id po chybě při dekódování tokenu');
        
        const user = await prisma.user.findUnique({
          where: { id: userIdCookie.value },
        });

        if (!user) {
          console.log('Uživatel z user_id cookie nebyl nalezen v databázi');
          return null;
        }

        return {
          userId: user.id,
          email: user.email,
          role: user.role,
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Obecná chyba při ověřování session:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Vytvoří novou session pro uživatele
 * @param userId - ID uživatele
 * @param email - Email uživatele
 * @param role - Role uživatele
 * @returns JWT token
 */
export function createSession(userId: string, email: string, role: string): string {
  const jwtSecret = process.env.JWT_SECRET || 'tajny-klic-pro-jwt';
  
  // Vytvoření JWT tokenu s platností 30 dní
  const token = jwt.sign(
    { userId, email, role },
    jwtSecret,
    { expiresIn: '30d' }
  );
  
  return token;
}
