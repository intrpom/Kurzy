/**
 * Utility pro handling chyb v admin rozhraní
 */

export interface AdminApiError {
  error: string;
  code?: string;
  action?: string;
}

/**
 * Zpracuje chybu z admin API a provede příslušnou akci
 * @param response - Response z fetch
 * @param fallbackMessage - Záložní chybová zpráva
 * @returns Promise<never> - vždy throwne error
 */
export async function handleAdminApiError(
  response: Response, 
  fallbackMessage: string = 'Nastala neočekávaná chyba'
): Promise<never> {
  let errorData: AdminApiError;
  
  try {
    errorData = await response.json();
  } catch {
    // Pokud se nepodaří parsovat JSON, použijeme fallback
    errorData = {
      error: `${fallbackMessage} (${response.status})`,
      code: 'UNKNOWN_ERROR'
    };
  }

  // Speciální handling pro různé typy chyb
  switch (errorData.code) {
    case 'SESSION_EXPIRED':
      alert('Vaše session vypršela. Budete přesměrováni na přihlášení.');
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      break;
      
    case 'FORBIDDEN':
      alert('Nemáte oprávnění k této akci. Kontaktujte administrátora.');
      break;
      
    case 'UNAUTHORIZED':
      alert('Nejste přihlášeni. Budete přesměrováni na přihlášení.');
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      break;
      
    default:
      // Pro ostatní chyby jen zobrazíme error message
      break;
  }

  // Vždy throwne error s příslušnou zprávou
  throw new Error(errorData.error || fallbackMessage);
}

/**
 * Wrapper pro fetch s automatickým error handlingem pro admin API
 * @param url - URL endpointu
 * @param options - Fetch options
 * @param fallbackMessage - Záložní chybová zpráva
 * @returns Promise<Response>
 */
export async function adminApiFetch(
  url: string, 
  options: RequestInit = {}, 
  fallbackMessage?: string
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    await handleAdminApiError(response, fallbackMessage);
  }

  return response;
}

/**
 * Zobrazí user-friendly error zprávu
 * @param error - Error objekt
 * @param context - Kontext kde se chyba stala
 */
export function showAdminError(error: Error, context: string = 'operace') {
  console.error(`Admin chyba při ${context}:`, error);
  
  // Můžeme zde přidat toast notifikace nebo jiný UI feedback
  // Pro teď použijeme console.error a můžeme rozšířit později
}
