'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import globalAuthState from '@/lib/global-auth-state';

// Globální ochrana proti duplikátním voláním
const globalVerificationGuard = new Set<string>();

// Globální Set pro sledování již zpracovaných tokenů
const processedTokens = new Set<string>();

interface VerifyAuthProps {
  token: string;
  email: string;
  courseId?: string;
  slug?: string;
  price?: string;
  action?: string;
}

const VerifyAuth: React.FC<VerifyAuthProps> = ({ token, email, courseId, slug, price, action }) => {
  // PRVNÍ KONTROLA - pokud už byl token zpracován globálně
  if (processedTokens.has(token)) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck className="text-green-600 text-2xl" />
        </div>
        <h2 className="text-2xl font-medium mb-4">Přihlášení dokončeno</h2>
        <p className="text-neutral-700">Již ověřeno, přesměrovávám...</p>
      </div>
    );
  }
  
  // OKAMŽITÁ kontrola - pokud už byl token ověřen, přesměruj ihned
  const alreadyVerified = typeof window !== 'undefined' ? sessionStorage.getItem(`verified_${token}`) : null;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(alreadyVerified ? 'success' : 'loading');
  const [message, setMessage] = useState<string>(alreadyVerified ? 'Již ověřeno, přesměrovávám...' : 'Ověřujeme váš přihlašovací odkaz...');
  const router = useRouter();
  
  // Použijeme useRef pro sledování, zda již bylo ověření provedeno
  const verificationAttempted = useRef<boolean>(false);
  
  // Okamžité přesměrování pokud už je ověřeno
  if (alreadyVerified && typeof window !== 'undefined') {
    const redirectUrl = courseId && slug ? `/kurzy/${slug}` : '/';
    setTimeout(() => {
      router.push(redirectUrl);
    }, 50);
  }

  useLayoutEffect(() => {
    // Kontrola základních požadavků
    if (!token || !email) {
      setStatus('error');
      setMessage('Chybí token nebo e-mail pro ověření.');
      return;
    }
    
    // SILNÁ ochrana - kontrola zda už byl tento token ověřen
    const tokenKey = `${token}_${email}`;
    const alreadyVerified = sessionStorage.getItem(`verified_${token}`);
    if (alreadyVerified) {
      const redirectUrl = courseId && slug ? `/kurzy/${slug}` : '/';
      setTimeout(() => {
        router.push(redirectUrl);
      }, 100);
      return;
    }
    
    // GLOBÁLNÍ ochrana - kontrola zda už token není zpracováván
    if (globalVerificationGuard.has(tokenKey)) {
      return;
    }
    
    // Přidáme token do globální ochrany
    globalVerificationGuard.add(tokenKey);
    
    // Kontrola, zda token už nebyl použit
    const tokenUsed = localStorage.getItem(`token_used_${token}`);
    if (tokenUsed) {
      setStatus('error');
      setMessage('Tento přihlašovací odkaz již byl použit. Požádejte o nový.');
      globalVerificationGuard.delete(tokenKey);
      return;
    }

    // Zabránění vícenásobnému volání API
    if (verificationAttempted.current) {
      globalVerificationGuard.delete(tokenKey);
      return;
    }
    
    // Označíme, že jsme již provedli pokus o ověření
    verificationAttempted.current = true;
    
    // Označit token jako zpracovávaný
    processedTokens.add(token);
    
    setStatus('loading');
    setMessage('Ověřuji váš přihlašovací token...');
    
    const verifyToken = async () => {
      try {
        
        // Přidáme timestamp pro zabránění cachování
        const timestamp = Date.now();
        
        // Použijeme přímé volání API bez použití Next.js API routes
        const apiUrl = `/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}&_=${timestamp}`;
        
        // Použijeme XMLHttpRequest pro lepší podporu cookies
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true; // Důležité pro cross-origin požadavky s cookies
        
        // Vytvoříme Promise pro zpracování XHR požadavku
        const xhrPromise = new Promise((resolve, reject) => {
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const responseData = JSON.parse(xhr.responseText);
                  resolve(responseData);
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
                  reject(new Error('Chyba při parsování odpovědi: ' + errorMessage));
                }
              } else {
                reject(new Error('HTTP chyba: ' + xhr.status));
              }
            }
          };
        });
        
        // Otevřeme a odešleme požadavek
        xhr.open('GET', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
        xhr.send();
        
        // Počkáme na dokončení požadavku
        const data = await xhrPromise as any;

        if (data.success) {
          setStatus('success');
          setMessage('Přihlášení bylo úspěšné!');
          
          // DŮLEŽITÉ: Označit token jako zpracovaný HNED po úspěchu
          processedTokens.add(token);
          
          // Uložíme uživatele do localStorage a aktualizujeme stav
          if (data.user) {
            globalAuthState.login(data.user);
          } else {
            // Fallback - reinicializace pokud nejsou user data
            try {
              await globalAuthState.reinitialize();
            } catch (error) {
              console.error('Chyba při reinicializaci autentizace:', error);
            }
          }
          
          // Uložení informace o ověření tokenu do sessionStorage
          const tokenKey = `verified_${token}`;
          sessionStorage.setItem(tokenKey, 'true');
          
          // Pokud je akce "purchase", nejprve zkontrolujeme vlastnictví kurzu
          if (action === 'purchase' && courseId && slug && price) {
            setMessage('Kontroluji dostupnost kurzu...');
            
            try {
              // Kontrola, zda už uživatel kurz nevlastní
              const accessResponse = await fetch(`/api/user/courses?courseId=${courseId}&_=${Date.now()}`);
              const accessData = await accessResponse.json();
              
              if (accessData.hasAccess) {
                setStatus('success');
                setMessage('Tento kurz již vlastníte! Přesměrovávám na váš kurz...');
                setTimeout(() => {
                  router.push(`/moje-kurzy/${slug}`);
                }, 2000);
                return;
              }

              setMessage('Přesměrovávám na platbu...');

              const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  courseId,
                  courseSlug: slug,
                  courseTitle: `Kurz ${slug}`,
                  price: Number(price),
                }),
              });

              const stripeData = await response.json();

              if (stripeData.success && stripeData.url) {
                // Přesměrovat na Stripe Checkout
                window.location.href = stripeData.url;
                return; // Nespouštět standardní přesměrování
              } else {
                throw new Error(stripeData.error || 'Nepodařilo se vytvořit platební session');
              }
            } catch (error) {
              console.error('Chyba při kontrole kurzu nebo vytváření Stripe checkout:', error);
              setStatus('error');
              setMessage('Nepodařilo se zpracovat požadavek. Zkuste to prosím později.');
              return;
            }
          }
          
          // Standardní přesměrování pro nepladené kurzy
          const redirectUrl = courseId && slug ? `/kurzy/${slug}` : '/';
          
          // Nastavení příznaku pro zabránění smyčce API volání
          sessionStorage.setItem('skipAuthCheck', 'true');
          
          
          // Nastavíme příznaky pro sledování úspěšného ověření
          localStorage.setItem('recentAuth', 'true');
          localStorage.setItem('authTimestamp', Date.now().toString());
          
          // Nastavíme příznak pro tento konkrétní token, že byl úspěšně ověřen
          localStorage.setItem(`token_verified_${token}`, 'true');
          
          // Označíme token jako použitý - prevence opakovaného použití
          localStorage.setItem(`token_used_${token}`, Date.now().toString());
          
          // Už nepotřebujeme iframe - globalAuthState se postará o správné načtení
          
          
          // Vyčistíme globální guard
          globalVerificationGuard.delete(tokenKey);
          
          // Použít Next.js router místo window.location.href
          setTimeout(() => {
            router.push(redirectUrl);
          }, 800);
        } else {
          setStatus('error');
          
          // Specifické zprávy podle typu chyby
          if (data.action === 'token_already_used') {
            setMessage('✅ Přihlašovací odkaz již byl použit!\n\nVypadá to, že jste již přihlášeni. Pokud se potřebujete přihlásit znovu, požádejte o nový odkaz.');
          } else if (data.action === 'token_expired') {
            setMessage('⏰ Platnost odkazu vypršela!\n\nPřihlašovací odkazy jsou platné pouze 24 hodin. Požádejte o nový odkaz.');
          } else {
            setMessage(data.error || 'Při ověřování přihlašovacího odkazu došlo k chybě.');
          }
          
          globalVerificationGuard.delete(tokenKey); // Vyčistíme guard při chybě
        }
      } catch (error) {
        setStatus('error');
        globalVerificationGuard.delete(tokenKey); // Vyčistíme guard při chybě
        setMessage('Při ověřování přihlašovacího odkazu došlo k chybě.');
        console.error('Chyba při ověřování tokenu:', error);
      }
    };

    // Spustit ověření
    verifyToken();
    
    // Cleanup funkce, která se zavolá při odmontování komponenty
    return () => {
      verificationAttempted.current = false;
      globalVerificationGuard.delete(tokenKey);
    }
  }, [token, email, router, courseId, slug]); // Správné dependencies

  return (
    <div className="text-center py-8">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiLoader className="text-blue-600 text-2xl animate-spin" />
          </div>
          <h2 className="text-2xl font-medium mb-4">Ověřování přihlášení</h2>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="text-green-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-medium mb-4">Přihlášení úspěšné!</h2>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiX className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-medium mb-4">Chyba při přihlášení</h2>
        </>
      )}

      <div className="text-neutral-700">
        {message.split('\n').map((line, index) => (
          <p key={index} className={index === 0 ? "font-medium text-lg" : "mt-2"}>
            {line}
          </p>
        ))}
      </div>
      
      {status === 'error' && (
        <div className="mt-6 space-y-3">
          {message.includes('již byl použit') ? (
            <>
              <a href="/" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                Pokračovat na hlavní stránku
              </a>
              <div className="text-sm">
                <a href="/moje-kurzy" className="text-primary-600 hover:text-primary-800 underline">
                  Nebo přejít na moje kurzy
                </a>
              </div>
            </>
          ) : (
            <a href="/auth/login" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              Požádat o nový odkaz
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyAuth;
