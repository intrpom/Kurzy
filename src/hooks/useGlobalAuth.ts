/**
 * React hook pro používání globálního auth stavu
 */

import { useState, useEffect } from 'react';
import globalAuthState from '@/lib/global-auth-state';

interface UseGlobalAuthReturn {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: any | null;
  login: (user: any) => void;
  logout: () => void;
}

export function useGlobalAuth(): UseGlobalAuthReturn {
  const [state, setState] = useState(globalAuthState.getState());

  useEffect(() => {
    // Pokud není inicializováno, iniciuj
    if (!globalAuthState.isInitialized()) {
      globalAuthState.initialize();
    }

    // Přihlásit se k odběru změn
    const unsubscribe = globalAuthState.subscribe((newState) => {
      setState(newState);
    });

    // Nastavit aktuální stav
    setState(globalAuthState.getState());

    return unsubscribe;
  }, []);

  return {
    isAuthenticated: state.isAuthenticated,
    isInitialized: state.isInitialized,
    user: state.user,
    login: (user: any) => globalAuthState.login(user),
    logout: () => globalAuthState.logout()
  };
}
