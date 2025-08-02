import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';

/**
 * Factory function per inizializzare l'applicazione
 * Carica la configurazione prima che l'app venga avviata
 */
export function initializeApp(
  configService: ConfigService,
  authService: AuthService
): () => Promise<void> {
  return async (): Promise<void> => {
    try {
      console.log('🔴 APP INITIALIZER - Starting initialization...');
      
      // Carica la configurazione dell'app
      await configService.loadConfig();
      console.log('✅ App configuration loaded successfully');
      
      // Inizializza l'autenticazione dopo aver caricato la configurazione
      await authService.initializeAuth();
      console.log('✅ Auth service initialized successfully');
      
      console.log('🔴 APP INITIALIZER - Completed successfully');
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      throw error;
    }
  };
}
