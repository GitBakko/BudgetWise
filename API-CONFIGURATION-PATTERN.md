# API Configuration Pattern - app-config.json

## 🚨 CRITICAL: Mandatory API Configuration Approach

**This document explains the ONLY approved way to configure API endpoints in BudgetWise.**

## ❌ What NOT to Use

### NEVER Use Angular Proxy Configuration
```json
// ❌ PROHIBITED: proxy.conf.json
{
  "/api/*": {
    "target": "https://localhost:7268",
    "secure": false,
    "changeOrigin": true
  }
}
```

### NEVER Hardcode API URLs
```typescript
// ❌ PROHIBITED: Hardcoded URLs
this.http.get('/api/accounts')
this.http.get('https://localhost:7268/api/accounts')

// ❌ PROHIBITED: Direct environment usage
this.http.get(environment.apiUrl + '/api/accounts')
```

## ✅ Correct Approach: app-config.json

### 1. Configuration File Structure

**File**: `src/assets/config/app-config.json`
```json
{
  "apiUrl": "https://localhost:7268",
  "environment": "development",
  "features": {
    "enableLogging": true,
    "enableAnalytics": false,
    "enableDebugMode": true
  },
  "auth": {
    "tokenStorageKey": "budgetwise_token",
    "refreshTokenStorageKey": "budgetwise_refresh_token",
    "tokenExpirationBuffer": 300
  },
  "ui": {
    "theme": "light",
    "language": "it-IT",
    "dateFormat": "dd/MM/yyyy"
  }
}
```

### 2. Service Implementation Pattern

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  // ✅ RULE: Private method to get API URL using ConfigService
  private getAccountsApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/accounts`;
  }
  
  // ✅ RULE: Use configService.getApiUrl() for all HTTP calls
  async loadAccountsAsync(): Promise<Account[]> {
    this.loadingSignal.set(true);
    
    try {
      const accounts = await lastValueFrom(
        this.http.get<Account[]>(this.getAccountsApiUrl())
      );
      this.accountsSignal.set(accounts);
      return accounts;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load accounts');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async createAccountAsync(accountData: CreateAccountRequest): Promise<Account> {
    try {
      const newAccount = await lastValueFrom(
        this.http.post<Account>(this.getAccountsApiUrl(), accountData)
      );
      this.accountsSignal.update(current => [...current, newAccount]);
      return newAccount;
    } catch (error) {
      throw error;
    }
  }
}
```

### 3. How It Works

1. **App Initialization**: `APP_INITIALIZER` loads config before any component
2. **ConfigService**: Provides `getApiUrl()` method to all services  
3. **Dynamic URLs**: API endpoints are configurable per environment
4. **Consistent Pattern**: Same approach used by `AuthService`

### 4. Benefits

- **🎯 Environment Flexibility**: Different API URLs for dev/staging/prod
- **🔒 Security**: No hardcoded endpoints in source code
- **🚀 Performance**: Single configuration load at app startup
- **📱 Mobile-First**: Works seamlessly offline/online scenarios
- **🔄 Consistency**: Same pattern across all services

### 5. Real Examples

**AuthService** (existing reference):
```typescript
private getAuthApiUrl(): string {
  return `${this.configService.getApiUrl()}/api/auth`;
}
```

**AccountService** (new implementation):
```typescript
private getAccountsApiUrl(): string {
  return `${this.configService.getApiUrl()}/api/accounts`;
}
```

**Future Services**:
```typescript
private getTransactionsApiUrl(): string {
  return `${this.configService.getApiUrl()}/api/transactions`;
}

private getBudgetsApiUrl(): string {
  return `${this.configService.getApiUrl()}/api/budgets`;
}
```

## 🔧 Configuration Loading

The configuration is automatically loaded via `APP_INITIALIZER` in `app.config.ts`:

```typescript
{
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [ConfigService, AuthService],
  multi: true
}
```

## 📝 Checklist for New Services

When creating a new service:

- [ ] Import `ConfigService` with `inject(ConfigService)`
- [ ] Create private `get[Feature]ApiUrl()` method  
- [ ] Use `this.configService.getApiUrl()` for base URL
- [ ] Never hardcode API endpoints
- [ ] Follow same pattern as `AuthService` and `AccountService`

**This pattern is MANDATORY for all BudgetWise API integrations.**
