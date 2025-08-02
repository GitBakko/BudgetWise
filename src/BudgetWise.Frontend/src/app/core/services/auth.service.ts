import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

// Interfacce per i dati di autenticazione
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  displayName: string;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🚀 MODERN ANGULAR: Solo signals, niente più BehaviorSubject!
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  // Computed signals per stato derivato
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  
  // Computed signal per informazioni utente derivate
  public readonly userFullName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : null;
  });

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    // L'inizializzazione avverrà dopo il caricamento della configurazione
  }

  /**
   * Ottiene l'URL dell'API di autenticazione
   */
  private getAuthApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/auth`;
  }

  /**
   * Inizializza l'autenticazione - da chiamare dopo il caricamento della configurazione
   */
  public async initializeAuth(): Promise<void> {
    const token = this.getToken();
    const userData = localStorage.getItem('budgetwise_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.setAuthData(user);
        
        // 🚀 MODERN ANGULAR: async/await invece di Observable chain
        try {
          const isValid = await this.verifyTokenAsync();
          if (!isValid) {
            this.logout();
          }
        } catch (error) {
          console.error('🔴 Token verification failed:', error);
          this.logout();
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.logout();
      }
    }
  }

  /**
   * 🚀 MODERN ANGULAR: Effettua il login dell'utente con async/await
   */
  async loginAsync(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${this.getAuthApiUrl()}/login`, credentials)
      );
      
      this.handleAuthResponse(response);
      return response;
    } catch (error) {
      console.error('🔴 Login async error:', error);
      throw error;
    }
  }

  /**
   * 🚀 MODERN ANGULAR: Registra un nuovo utente con async/await
   */
  async registerAsync(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await lastValueFrom(
        this.http.post<AuthResponse>(`${this.getAuthApiUrl()}/register`, userData)
      );
      
      this.handleAuthResponse(response);
      return response;
    } catch (error) {
      console.error('🔴 Register async error:', error);
      throw error;
    }
  }

  /**
   * 🚀 MODERN ANGULAR: Verifica la validità del token corrente con async/await
   */
  async verifyTokenAsync(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const response = await lastValueFrom(
        this.http.get<{valid: boolean}>(`${this.getAuthApiUrl()}/verify`, { headers })
      );
      
      const isValid = response.valid;
      if (!isValid) {
        this.logout();
      }
      
      return isValid;
    } catch (error) {
      console.error('🔴 Token verification async error:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Effettua il logout dell'utente
   */
  logout(): void {
    localStorage.removeItem('budgetwise_token');
    localStorage.removeItem('budgetwise_user');
    
    // 🚀 MODERN ANGULAR: Aggiorna signals
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  /**
   * Ottiene il token corrente
   */
  getToken(): string | null {
    try {
      const tokenKey = this.configService.getAuthConfig().tokenStorageKey;
      return localStorage.getItem(tokenKey);
    } catch (error) {
      // Se la configurazione non è ancora caricata, usa la chiave di default
      return localStorage.getItem('budgetwise_token');
    }
  }

  /**
   * 🚀 MODERN ANGULAR: Ottiene l'utente corrente tramite signal
   */
  getCurrentUserSignal(): User | null {
    return this.currentUser();
  }

  /**
   * 🚀 MODERN ANGULAR: Controlla se l'utente è autenticato tramite signal
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Ottiene l'utente corrente (usando signals)
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Controlla se l'utente è autenticato (usando signals)
   */
  isAuthenticatedLegacy(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Gestisce la risposta di autenticazione salvando token e dati utente
   */
  private handleAuthResponse(response: AuthResponse): void {
    if (!response.success) {
      throw new Error(response.error || 'Login failed');
    }

    try {
      const authConfig = this.configService.getAuthConfig();
      localStorage.setItem(authConfig.tokenStorageKey, response.token);
    } catch (error) {
      // Fallback se la configurazione non è disponibile
      localStorage.setItem('budgetwise_token', response.token);
    }
    
    // Creiamo un User temporaneo dal displayName del backend
    const user: User = {
      id: Date.now(), // Temporaneo finché non implementiamo /verify
      email: '', // Da ottenere con verify
      firstName: response.displayName.split(' ')[0] || response.displayName,
      lastName: response.displayName.split(' ').slice(1).join(' ') || '',
      role: 'User',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    localStorage.setItem('budgetwise_user', JSON.stringify(user));
    this.setAuthData(user);
  }

  /**
   * Imposta i dati di autenticazione nei signals
   */
  private setAuthData(user: User): void {
    // 🚀 MODERN ANGULAR: Aggiorna signals
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }
}
