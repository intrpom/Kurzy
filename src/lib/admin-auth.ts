import { NextRequest } from 'next/server';
import { verifySession } from './auth';

/**
 * Middleware pro ověření admin oprávnění
 * @param request - NextRequest objekt
 * @returns Promise<boolean> - true pokud je uživatel admin
 */
export async function verifyAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    console.log('[ADMIN AUTH] Začínám ověřování admin přístupu');
    console.log('[ADMIN AUTH] Request URL:', request.url);
    console.log('[ADMIN AUTH] Request method:', request.method);
    
    // Debug cookies
    const allCookies = request.cookies.getAll();
    console.log('[ADMIN AUTH] Všechny cookies:', allCookies.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })));
    
    // Specifické cookies pro autentizaci
    const sessionCookie = request.cookies.get('session');
    const userIdCookie = request.cookies.get('user_id');
    const sessionCheckCookie = request.cookies.get('session_check');
    
    console.log('[ADMIN AUTH] Auth cookies detail:', {
      session: sessionCookie ? `přítomna (${sessionCookie.value.length} znaků)` : 'chybí',
      user_id: userIdCookie ? userIdCookie.value : 'chybí',
      session_check: sessionCheckCookie ? sessionCheckCookie.value : 'chybí'
    });
    
    // Ověříme session
    const session = await verifySession(request);
    
    if (!session) {
      console.log('[ADMIN AUTH] Žádná platná session z cookies');
      
      // ZÁLOŽNÍ ŘEŠENÍ: Zkusíme Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('[ADMIN AUTH] Zkouším Authorization header token');
        
        try {
          // Zde by byla logika pro ověření Bearer tokenu
          // Pro teď jen logujeme, že jsme našli token
          console.log('[ADMIN AUTH] Nalezen Bearer token:', token.substring(0, 10) + '...');
        } catch (error) {
          console.log('[ADMIN AUTH] Bearer token není platný');
        }
      }
      
      console.log('[ADMIN AUTH] Žádná platná session - přístup odepřen');
      return false;
    }

    console.log('[ADMIN AUTH] Session nalezena:', { 
      userId: session.userId, 
      email: session.email, 
      role: session.role 
    });

    // Kontrola admin role
    if (session.role !== 'ADMIN') {
      console.log('[ADMIN AUTH] Uživatel není admin:', session.role, '- očekáváno: ADMIN');
      return false;
    }

    console.log('[ADMIN AUTH] ✅ Přístup povolen pro admin:', session.email);
    return true;
  } catch (error) {
    console.error('[ADMIN AUTH] Chyba při ověřování:', error);
    return false;
  }
}

/**
 * Vytvoří Response s chybou 401 Unauthorized
 */
export function createUnauthorizedResponse(message: string = 'Přístup odepřen') {
  return new Response(
    JSON.stringify({ 
      error: message,
      code: 'UNAUTHORIZED' 
    }), 
    { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Vytvoří Response s chybou 403 Forbidden
 */
export function createForbiddenResponse(message: string = 'Nemáte oprávnění k této akci') {
  return new Response(
    JSON.stringify({ 
      error: message,
      code: 'FORBIDDEN' 
    }), 
    { 
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Vytvoří Response s chybou 401 pro vypršelou session
 */
export function createSessionExpiredResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Vaše session vypršela. Prosím přihlaste se znovu.',
      code: 'SESSION_EXPIRED',
      action: 'REDIRECT_TO_LOGIN'
    }), 
    { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
