'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, name?: string) => Promise<{ success: boolean; message: string; url?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efekt pro kontrolu autentizace při načtení aplikace
  useEffect(() => {
    // Kontrola, zda je potřeba ověřit autentizaci
    
    // Zkontrolujeme, zda je nastaven příznak recentAuth z VerifyAuth komponenty
    const recentAuth = localStorage.getItem('recentAuth');
    const authTimestamp = localStorage.getItem('authTimestamp');
    
    if (recentAuth === 'true' && authTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(authTimestamp, 10);
      const timeDiff = now - timestamp;
      
      
      // Zkontrolujeme, zda je v URL parametr auth (značí nedávné přesměrování)
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      
      if (authParam && timeDiff < 300000) { // 5 minut
        
        // Použijeme synchronní XMLHttpRequest pro okamžitou kontrolu autentizace
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('GET', `/api/auth/me?_=${now}`, false); // Synchronní požadavek
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '0');
        
        try {
          xhr.send();
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (data.authenticated && data.user) {
                setUser(data.user);
                setLoading(false);
                return;
              }
            } catch (parseError) {
              console.error('Chyba při parsování odpovědi:', parseError);
            }
          }
        } catch (xhrError) {
          console.error('Chyba při synchronním XHR:', xhrError);
        }
      }
    }
    
    // Standardní kontrola autentizace
    checkAuth();
    
    // Timeout pro loading stav - pokud se autentifikace nezdaří do 0.5 sekundy, zobrazíme jako nepřihlášeného
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Funkce pro kontrolu autentizace
  const checkAuth = async () => {
    // Timeout pro checkAuth - pokud se nezdaří do 1 sekundy, zobrazíme jako nepřihlášeného
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setUser(null);
    }, 1000);
    
    try {
      setLoading(true);
      
      
      // Zkontrolujeme, zda je nastaven příznak recentAuth z VerifyAuth komponenty
      const recentAuth = localStorage.getItem('recentAuth');
      const authTimestamp = localStorage.getItem('authTimestamp');
      
      if (recentAuth === 'true' && authTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(authTimestamp, 10);
        const timeDiff = now - timestamp;
        
        
        // Zkontrolujeme, zda je nastavená cookie user_id (non-httpOnly cookie)
        const userIdCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_id='));
          
        if (userIdCookie && timeDiff < 60000) {
          
          // Použijeme XMLHttpRequest pro kontrolu autentizace
          const xhr = new XMLHttpRequest();
          xhr.withCredentials = true; // Důležité pro cross-origin požadavky s cookies
          xhr.open('GET', `/api/auth/me?_=${now}`, false); // Synchronní požadavek
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          xhr.setRequestHeader('Pragma', 'no-cache');
          xhr.setRequestHeader('Expires', '0');
          
          try {
            xhr.send();
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              
              if (data.authenticated && data.user) {
                setUser(data.user);
                setLoading(false);
                return; // Úspěšná autentizace, končíme
              }
            }
          } catch (xhrError) {
            console.error('Chyba při synchronním XHR:', xhrError);
            // Pokračujeme na standardní fetch
          }
        }
      }
      
      // Standardní kontrola pomocí fetch
      const timestamp = Date.now();
      
      try {
        // Použijeme fetch s explicitním nastavením pro cookies
        const response = await fetch(`/api/auth/me?_=${timestamp}`, { 
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include', // Důležité pro zahrání cookies
          mode: 'cors' // Explicitní nastavení CORS
        });
        
        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (fetchError) {
        console.error('Chyba při fetch kontrole autentizace:', fetchError);
        setUser(null);
      }
    } catch (err) {
      // V případě chyby nastavíme uživatele na null
      console.error('Chyba při kontrole autentizace:', err);
      setUser(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Funkce pro přihlášení
  const login = async (email: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Došlo k chybě při přihlašování');
        return { success: false, message: data.error || 'Došlo k chybě při přihlašování' };
      }

      return { 
        success: true, 
        message: data.message || 'Přihlašovací odkaz byl odeslán',
        url: data.url // Toto je pouze pro testování, v produkci by se nemělo vracet
      };
    } catch (err) {
      console.error('Chyba při přihlašování:', err);
      setError('Došlo k chybě při přihlašování');
      return { success: false, message: 'Došlo k chybě při přihlašování' };
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro odhlášení
  const logout = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      localStorage.removeItem('recentAuth');
      localStorage.removeItem('authTimestamp');
    } catch (err) {
      console.error('Chyba při odhlašování:', err);
      setError('Došlo k chybě při odhlašování');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth musí být použit uvnitř AuthProvider');
  }
  return context;
}
