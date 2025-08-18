'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

interface VerifyAuthProps {
  token: string;
  email: string;
  courseId?: string;
  slug?: string;
}

const VerifyAuth: React.FC<VerifyAuthProps> = ({ token, email, courseId, slug }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Ověřujeme váš přihlašovací odkaz...');
  const { checkAuth } = useAuth();
  const router = useRouter();
  
  // Použijeme useRef pro sledování, zda již bylo ověření provedeno
  const verificationAttempted = useRef<boolean>(false);

  useEffect(() => {
    console.log('VerifyAuth useEffect spuštěn');
    
    // Vždy ověříme token, i když již byl dříve ověřen
    // Odstraníme všechny předchozí příznaky autentizace
    localStorage.removeItem(`token_verified_${token}`);
    localStorage.removeItem('auth_verified');
    localStorage.removeItem('auth_verified_time');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('skipAuthCheck');
    
    console.log('Odstraněny všechny předchozí příznaky autentizace');
    
    // Nastavíme stav na loading
    setStatus('loading');
    setMessage('Ověřuji váš přihlašovací token...');

    // Zabránění vícenásobnému volání API
    if (verificationAttempted.current) {
      console.log('Ověření již bylo zahájeno, nebudeme ho spouštět znovu');
      return;
    }
    
    // Označíme, že jsme již provedli pokus o ověření
    verificationAttempted.current = true;
    console.log('Nastaveno verificationAttempted=true');
    
    const verifyToken = async () => {
      try {
        console.log('Začínám ověřovat token:', { token, email });
        
        // Přidáme timestamp pro zabránění cachování
        const timestamp = Date.now();
        
        // Použijeme přímé volání API bez použití Next.js API routes
        const apiUrl = `/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}&_=${timestamp}`;
        console.log('Volám API endpoint:', apiUrl);
        
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
        console.log('Parsovaná data z API:', data);

        if (data.success) {
          setStatus('success');
          console.log('Přihlášení úspěšné, připravuji přesměrování');
          setMessage('Přihlášení bylo úspěšné!');
          
          // Explicitně zavoláme checkAuth() pro aktualizaci stavu autentizace
          try {
            // Počkáme na dokončení kontroly autentizace
            await checkAuth();
            console.log('Autentizace byla úspěšně ověřena');
          } catch (error) {
            console.error('Chyba při kontrole autentizace:', error);
          }
          
          // Nastavení příznaků v localStorage pro optimalizaci
          localStorage.setItem('recentAuth', 'true');
          localStorage.setItem('authTimestamp', Date.now().toString());
          console.log('Nastaveny příznaky v localStorage: recentAuth=true, authTimestamp=' + Date.now());
          
          // Uložení informace o ověření tokenu do sessionStorage
          const tokenKey = `verified_${token}`;
          sessionStorage.setItem(tokenKey, 'true');
          console.log(`Uložena informace o ověření tokenu do sessionStorage: ${tokenKey}`);
          
          // Přímé přesměrování bez použití API volání
          const redirectUrl = courseId && slug ? `/kurzy/${slug}` : '/';
          console.log(`Připravuji přesměrování na: ${redirectUrl}`);
          
          // Nastavení příznaku pro zabránění smyčce API volání
          sessionStorage.setItem('skipAuthCheck', 'true');
          
          console.log('Ověření tokenu úspěšné, připravuji přesměrování');
          
          // Nastavíme příznaky pro sledování úspěšného ověření
          localStorage.setItem('recentAuth', 'true');
          localStorage.setItem('authTimestamp', Date.now().toString());
          
          // Nastavíme příznak pro tento konkrétní token, že byl úspěšně ověřen
          localStorage.setItem(`token_verified_${token}`, 'true');
          
          console.log('Nastavené příznaky:', {
            recentAuth: localStorage.getItem('recentAuth'),
            authTimestamp: localStorage.getItem('authTimestamp'),
            tokenVerified: localStorage.getItem(`token_verified_${token}`)
          });
          
          // Vytvoříme iframe pro načtení API endpointu /api/auth/me
          // Toto zajistí, že cookies budou správně nastavené před přesměrováním
          const authCheckIframe = document.createElement('iframe');
          authCheckIframe.style.display = 'none';
          authCheckIframe.src = `/api/auth/me?_=${Date.now()}`;
          document.body.appendChild(authCheckIframe);
          
          console.log('Přidán iframe pro načtení /api/auth/me');
          
          // Počkáme 2 sekundy, aby se iframe načetl a cookies se správně nastavily
          setTimeout(() => {
            console.log(`Provádím přesměrování na: ${redirectUrl}`);
            
            // Použijeme form submit pro přesměrování, což zajistí přenos cookies
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = redirectUrl;
            
            // Přidáme timestamp jako parametr pro zabránění cachování
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_';
            input.value = Date.now().toString();
            form.appendChild(input);
            
            // Přidáme parametr auth=true pro označení, že jde o přesměrování po autentizaci
            const authInput = document.createElement('input');
            authInput.type = 'hidden';
            authInput.name = 'auth';
            authInput.value = 'true';
            form.appendChild(authInput);
            
            document.body.appendChild(form);
            console.log('Odesílám formulář pro přesměrování s parametrem auth=true');
            form.submit();
          }, 2000);
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
  }, [token, email, courseId, slug, router]);

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
