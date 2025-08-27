'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import globalAuthState from '@/lib/global-auth-state';

interface VerifyAuthProps {
  token: string;
  email: string;
  courseId?: string;
  slug?: string;
  price?: string;
  action?: string;
}

const VerifyAuth: React.FC<VerifyAuthProps> = ({ token, email, courseId, slug, price, action }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Ověřujeme váš přihlašovací odkaz...');
  const router = useRouter();
  
  // Použijeme useRef pro sledování, zda již bylo ověření provedeno
  const verificationAttempted = useRef<boolean>(false);

  useEffect(() => {
    // Jednoduché řešení - jen kontrola verificationAttempted
    setStatus('loading');
    setMessage('Ověřuji váš přihlašovací token...');

    // Zabránění vícenásobnému volání API
    if (verificationAttempted.current) {
      return;
    }
    
    // Označíme, že jsme již provedli pokus o ověření
    verificationAttempted.current = true;
    
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
                  window.location.href = `/moje-kurzy/${slug}`;
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
          
          // Už nepotřebujeme iframe - globalAuthState se postará o správné načtení
          
          
          // Jednoduché přesměrování
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 800);
        } else {
          setStatus('error');
          setMessage(data.error || 'Při ověřování přihlašovacího odkazu došlo k chybě.');
          console.error('Chyba při ověřování:', data.error || 'Neznámá chyba');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Při ověřování přihlašovacího odkazu došlo k chybě.');
        console.error('Chyba při ověřování tokenu:', error);
      }
    };

    if (token && email) {
      verifyToken();
    } else {
      setStatus('error');
      setMessage('Chybí token nebo e-mail pro ověření.');
    }
    
    // Cleanup funkce, která se zavolá při odmontování komponenty
    return () => {
      verificationAttempted.current = false;
    }
  }, [token]); // Běží jen když se změní token (což se nikdy nestane)

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

      <p className="text-neutral-700">{message}</p>
      
      {status === 'error' && (
        <div className="mt-6">
          <a href="/auth/login" className="text-primary-600 hover:text-primary-800 underline">
            Zkusit znovu
          </a>
        </div>
      )}
    </div>
  );
};

export default VerifyAuth;
