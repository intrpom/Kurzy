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

    try {
      // 1. Zkontroluj localStorage verifikaci
      const isVerified = this.getStoredVerification();
      
      // 2. Zkontroluj session cookies
      const hasAuthCookie = this.hasAuthCookies();

      if (isVerified && hasAuthCookie) {
        // ✅ OVĚŘENÝ + platné cookies = použij localStorage data
        const storedUser = this.getStoredUser();
        this.setState({
          isAuthenticated: true,
          isInitialized: true,
          user: storedUser
        });
      } else if (isVerified && !hasAuthCookie) {
        // ❌ OVĚŘENÝ ale cookies vypršely = smaž localStorage a odhlás
        this.clearStoredAuth();
        this.setState({
          isAuthenticated: false,
          isInitialized: true,
          user: null
        });
      } else if (!isVerified && hasAuthCookie) {
        // 🔍 Cookies jsou, ale localStorage není = možná nový prohlížeč
        // KONZERVATIVNÍ přístup: Pouze pokud jsou cookies opravdu validní
        if (hasAuthCookie && document.cookie.includes('session=')) {
          const user = await this.verifyAuthWithAPI();
          if (user) {
            this.storeUserAuth(user);
          }
          this.setState({
            isAuthenticated: !!user,
            isInitialized: true,
            user: user
          });
        } else {
          // Fallback - považovat za nepřihlášeného
          this.setState({
            isAuthenticated: false,
            isInitialized: true,
            user: null
          });
        }
      } else {
        // ❌ Žádné indikátory = nepřihlášený
        this.setState({
          isAuthenticated: false,
          isInitialized: true,
          user: null
        });
      }
    } catch (error) {
      console.error('GlobalAuthState: Chyba při inicializaci:', error);
      // V případě chyby považuj za nepřihlášeného a smaž localStorage
      this.clearStoredAuth();
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
    return document.cookie.includes('session') || document.cookie.includes('user_id');
  }

  /**
   * Získání uloženého stavu verifikace
   */
  private getStoredVerification(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('user_verified') === 'true';
  }

  /**
   * Získání uložených dat uživatele
   */
  private getStoredUser(): any | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Uložení stavu přihlášeného uživatele
   */
  private storeUserAuth(user: any): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('user_verified', 'true');
      localStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Chyba při ukládání do localStorage:', error);
    }
  }

  /**
   * Smazání uloženého stavu
   */
  private clearStoredAuth(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('user_verified');
    localStorage.removeItem('user_data');
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
    this.storeUserAuth(user);
    this.setState({
      isAuthenticated: true,
      user: user
    });
  }

  /**
   * Odhlášení uživatele
   */
  logout(): void {
    this.clearStoredAuth();
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
