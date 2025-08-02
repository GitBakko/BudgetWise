import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../models/app-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;
  private configLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Carica la configurazione dell'app dal file JSON
   * Deve essere chiamato all'avvio dell'applicazione
   */
  async loadConfig(): Promise<AppConfig> {
    if (this.configLoaded && this.config) {
      return this.config;
    }

    try {
      // Determina quale file di configurazione caricare basandosi sull'ambiente
      const configFile = this.isProduction() ? 'app-config.prod.json' : 'app-config.json';
      const configPath = `assets/config/${configFile}`;
      
      this.config = await firstValueFrom(
        this.http.get<AppConfig>(configPath)
      );
      
      this.configLoaded = true;
      
      if (this.config.features.enableLogging) {
        console.log('🔧 Configuration loaded:', this.config);
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Failed to load app configuration:', error);
      throw new Error('Failed to load application configuration');
    }
  }

  /**
   * Ottiene la configurazione corrente
   * Lancia un errore se la configurazione non è stata ancora caricata
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Ottiene l'URL dell'API
   */
  getApiUrl(): string {
    console.log('🔴 CONFIG SERVICE - getApiUrl called');
    const config = this.getConfig();
    console.log('🔴 Config object:', config);
    console.log('🔴 API URL:', config.apiUrl);
    return config.apiUrl;
  }

  /**
   * Ottiene le feature flags
   */
  getFeatures() {
    return this.getConfig().features;
  }

  /**
   * Ottiene la configurazione di autenticazione
   */
  getAuthConfig() {
    return this.getConfig().auth;
  }

  /**
   * Ottiene la configurazione UI
   */
  getUiConfig() {
    return this.getConfig().ui;
  }

  /**
   * Verifica se siamo in ambiente di produzione
   */
  isProduction(): boolean {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  /**
   * Verifica se il debug è abilitato
   */
  isDebugEnabled(): boolean {
    return this.getConfig().features.enableDebugMode;
  }

  /**
   * Verifica se il logging è abilitato
   */
  isLoggingEnabled(): boolean {
    return this.getConfig().features.enableLogging;
  }
}
