import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

// DTOs and Types
export interface Account {
  id: number;
  name: string;
  accountType: string;
  balance: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountRequest {
  name: string;
  accountType: string;
  balance: number;
  description?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  accountType?: string;
  balance?: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  // ✅ RULE 1: Inject HttpClient with inject()
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  // ✅ RULE 2: Private signals for internal state
  private accountsSignal = signal<Account[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // ✅ RULE 3: Public readonly signals for components
  public readonly accounts = this.accountsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  // ✅ RULE 4: Computed signals for derived state
  public readonly hasAccounts = computed(() => this.accounts().length > 0);
  public readonly isEmpty = computed(() => this.accounts().length === 0 && !this.loading());
  public readonly totalBalance = computed(() => 
    this.accounts().reduce((total, account) => total + account.balance, 0)
  );
  
  // ✅ RULE: Private method to get accounts API URL using ConfigService
  private getAccountsApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/accounts`;
  }
  
  // ✅ RULE 5: Async methods return Promises
  async loadAccountsAsync(): Promise<Account[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
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
  
  async getAccountAsync(id: number): Promise<Account> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const account = await lastValueFrom(
        this.http.get<Account>(`${this.getAccountsApiUrl()}/${id}`)
      );
      return account;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to load account');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async createAccountAsync(accountData: CreateAccountRequest): Promise<Account> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const newAccount = await lastValueFrom(
        this.http.post<Account>(this.getAccountsApiUrl(), accountData)
      );
      
      // ✅ RULE 6: Update arrays properly with signals
      this.accountsSignal.update(current => [...current, newAccount]);
      return newAccount;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create account');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async updateAccountAsync(id: number, updates: UpdateAccountRequest): Promise<Account> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const updatedAccount = await lastValueFrom(
        this.http.put<Account>(`${this.getAccountsApiUrl()}/${id}`, updates)
      );
      
      // ✅ RULE 7: Update arrays properly with signals
      this.accountsSignal.update(current => 
        current.map(account => account.id === id ? updatedAccount : account)
      );
      return updatedAccount;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update account');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async deleteAccountAsync(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      await lastValueFrom(
        this.http.delete(`${this.getAccountsApiUrl()}/${id}`)
      );
      
      // ✅ RULE 8: Remove from arrays with update()
      this.accountsSignal.update(current => 
        current.filter(account => account.id !== id)
      );
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete account');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  // Helper methods for specific account types
  getAccountsByType(accountType: string): Account[] {
    return this.accounts().filter(account => account.accountType === accountType);
  }
  
  getAccountById(id: number): Account | undefined {
    return this.accounts().find(account => account.id === id);
  }
  
  // Calculate balance totals by type
  getBalanceByType(accountType: string): number {
    return this.getAccountsByType(accountType)
      .reduce((total, account) => total + account.balance, 0);
  }
}
