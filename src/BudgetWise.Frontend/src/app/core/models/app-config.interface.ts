export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'staging';
  features: {
    enableLogging: boolean;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };
  auth: {
    tokenStorageKey: string;
    refreshTokenStorageKey: string;
    tokenExpirationBuffer: number; // seconds
  };
  ui: {
    theme: string;
    language: string;
    dateFormat: string;
  };
}

export interface AuthConfig {
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  tokenExpirationBuffer: number;
}

export interface FeatureFlags {
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
}

export interface UiConfig {
  theme: string;
  language: string;
  dateFormat: string;
}
