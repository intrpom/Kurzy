'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import globalAuthState from '@/lib/global-auth-state';

type User = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, name?: string) => Promise<{ success: boolean; message: string; url?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronizace s globálním stavem - JEDINÉ místo kde se čte stav
  useEffect(() => {
    const unsubscribe = globalAuthState.subscribe((state) => {
      setUser(state.user);
      setLoading(!state.isInitialized);
      setIsInitialized(state.isInitialized);
    });

    // Nastavit počáteční stav
    const currentState = globalAuthState.getState();
    setUser(currentState.user);
    setLoading(!currentState.isInitialized);
    setIsInitialized(currentState.isInitialized);

    // Inicializovat POUZE pokud ještě není inicializováno
    if (!currentState.isInitialized) {
      globalAuthState.initialize();
    }

    return unsubscribe;
  }, []);

  // Již nepotřebujeme žádné další useEffect - vše řeší GlobalAuthState

  // Zjednodušená funkce pro kontrolu autentizace - deleguje na GlobalAuthState
  const checkAuth = async () => {
    // Pokud již probíhá inicializace, neděláme nic
    if (globalAuthState.isInitialized()) {
      return;
    }
    
    // Jinak spustíme reinicializaci
    await globalAuthState.reinitialize();
  };

  // Funkce pro přihlášení
  const login = async (email: string, name?: string) => {
    setLoading(true);
    try {
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
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Vyčistit localStorage
      localStorage.removeItem('recentAuth');
      localStorage.removeItem('authTimestamp');
      
      // Aktualizuj globální stav - toto automaticky aktualizuje i lokální stav
      globalAuthState.logout();
    } catch (err) {
      console.error('Chyba při odhlašování:', err);
      setError('Došlo k chybě při odhlašování');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isInitialized, error, login, logout, checkAuth }}>
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
