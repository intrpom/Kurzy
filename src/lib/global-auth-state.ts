/**
 * Globální správa stavu přihlášení pro celou aplikaci
 * Jedna kontrola při načtení webu, pak používání cache po celou dobu
 */

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: any | null;
}

class GlobalAuthState {
  private state: AuthState = {
    isAuthenticated: false,
    isInitialized: false,
    user: null
  };

  private listeners: Array<(state: AuthState) => void> = [];

  /**
   * Inicializace - provádí se jen jednou při první návštěvě
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) return;

    console.log('🔍 GlobalAuthState: Inicializace stavu přihlášení...');

    try {
      // Rychlá kontrola lokálních indikátorů
      const hasAuthCookie = this.hasAuthCookies();
      const hasRecentAuth = this.hasRecentAuth();

      if (hasAuthCookie || hasRecentAuth) {
        // Pokud jsou indikátory přihlášení, ověř to přes API
        const user = await this.verifyAuthWithAPI();
        this.setState({
          isAuthenticated: !!user,
          isInitialized: true,
          user: user
        });
      } else {
        // Žádné indikátory = nepřihlášený
        this.setState({
          isAuthenticated: false,
          isInitialized: true,
          user: null
        });
      }
    } catch (error) {
      console.error('GlobalAuthState: Chyba při inicializaci:', error);
      // V případě chyby považuj za nepřihlášeného
      this.setState({
        isAuthenticated: false,
        isInitialized: true,
        user: null
      });
    }
  }

  /**
   * Kontrola auth cookies
   */
  private hasAuthCookies(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('auth_token') || document.cookie.includes('user_id');
  }

  /**
   * Kontrola recent auth z localStorage
   */
  private hasRecentAuth(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const recentAuth = localStorage.getItem('recentAuth');
    const authTimestamp = localStorage.getItem('authTimestamp');
    
    if (recentAuth === 'true' && authTimestamp) {
      const now = Date.now();
      const timestamp = parseInt(authTimestamp, 10);
      const timeDiff = now - timestamp;
      return timeDiff < 300000; // 5 minut
    }
    
    return false;
  }

  /**
   * Ověření přes API
   */
  private async verifyAuthWithAPI(): Promise<any | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.authenticated ? data.user : null;
      }
    } catch (error) {
      console.error('GlobalAuthState: API ověření selhalo:', error);
    }
    
    return null;
  }

  /**
   * Aktualizace stavu
   */
  private setState(newState: Partial<AuthState>): void {
    this.state = { ...this.state, ...newState };
    console.log('🔄 GlobalAuthState: Stav aktualizován:', this.state);
    
    // Notify všechny listeners
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Získání aktuálního stavu
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Je uživatel přihlášený?
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Je stav inicializovaný?
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  /**
   * Získání uživatele
   */
  getUser(): any | null {
    return this.state.user;
  }

  /**
   * Přihlášení uživatele
   */
  login(user: any): void {
    this.setState({
      isAuthenticated: true,
      user: user
    });
  }

  /**
   * Odhlášení uživatele
   */
  logout(): void {
    this.setState({
      isAuthenticated: false,
      user: null
    });
  }

  /**
   * Registrace listener pro změny stavu
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Vrať unsubscribe funkci
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Vynucená reinicializace (např. po logout)
   */
  reinitialize(): Promise<void> {
    this.state.isInitialized = false;
    return this.initialize();
  }
}

// Singleton instance
const globalAuthState = new GlobalAuthState();

export default globalAuthState;
