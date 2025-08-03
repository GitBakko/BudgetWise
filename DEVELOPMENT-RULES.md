# BudgetWise Development Rules & Patterns

**MANDATORY REFERENCE DOCUMENT**  
**Updated**: August 1, 2025  
**Status**: Authentication System Complete

## 🚨 **CRITICAL: These Rules Are Non-Negotiable**

This document establishes the **MANDATORY** development patterns for BudgetWise. 
**ANY CODE that doesn't follow these patterns MUST be refactored before merging.**

---

## 🎯 **Core Development Philosophy**

### **The Modern Angular Way (Only Way Forward)**

**WE HAVE MIGRATED FROM:**
- ❌ Observable-based state management (BehaviorSubject)
- ❌ RxJS pipe chains for data flow
- ❌ Observable-based HTTP handling in components
- ❌ Async pipe in templates

**TO:**
- ✅ **Angular Signals** for ALL state management
- ✅ **Async/Await + Promises** for ALL HTTP operations
- ✅ **Computed Signals** for derived state
- ✅ **Direct signal calls** in templates
- 📱 **MOBILE-FIRST** design for all components

---

## � **CRITICAL: API Configuration Pattern**

### **🚨 NEVER USE ANGULAR PROXY CONFIGURATION**

**❌ PROHIBITED:**
- Angular proxy configuration (`proxy.conf.json`)
- Hardcoded API URLs in services
- Direct environment variables for API endpoints

**✅ MANDATORY APPROACH: `app-config.json`**

All API endpoints **MUST** be configured through the `app-config.json` file and accessed via `ConfigService`.

### **1. Configuration File Structure**

```json
// src/assets/config/app-config.json
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

### **2. Service Implementation Pattern**

**✅ CORRECT Pattern (like `AuthService`):**

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  // ✅ RULE: Private method to build API URLs
  private getFeatureApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/feature`;
  }
  
  // ✅ RULE: Use configService.getApiUrl() for all HTTP calls
  async loadDataAsync(): Promise<DataType[]> {
    try {
      const result = await lastValueFrom(
        this.http.get<DataType[]>(this.getFeatureApiUrl())
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  async createItemAsync(item: CreateRequest): Promise<DataType> {
    try {
      const created = await lastValueFrom(
        this.http.post<DataType>(this.getFeatureApiUrl(), item)
      );
      return created;
    } catch (error) {
      throw error;
    }
  }
}
```

### **3. Why This Pattern is Mandatory**

- **🎯 Environment Flexibility**: Different API URLs for dev/staging/prod
- **🔒 Security**: No hardcoded endpoints in source code
- **🚀 Performance**: Single configuration load at app startup
- **📱 Mobile-First**: Works seamlessly offline/online scenarios
- **🔄 Consistency**: Same pattern as existing `AuthService`

### **4. Configuration Loading**

The configuration is automatically loaded via `APP_INITIALIZER` in `app.config.ts`:

```typescript
{
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [ConfigService, AuthService],
  multi: true
}
```

**Configuration is loaded BEFORE any component is initialized.**

**📋 For complete reference**: See `API-CONFIGURATION-PATTERN.md`

---

## �📋 **MANDATORY Service Pattern**

### **Template: Every Service Must Follow This**

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class [FeatureName]Service {
  // ✅ RULE 1: Inject ConfigService for API endpoints
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  // ✅ RULE 2: ALL state as private signals
  private dataSignal = signal<DataType[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // ✅ RULE 3: Public readonly signals only
  public readonly data = this.dataSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  // ✅ RULE 4: Computed signals for derived state
  public readonly hasData = computed(() => this.data().length > 0);
  public readonly isEmpty = computed(() => !this.loading() && this.data().length === 0);
  
  // ✅ RULE 5: Private method for API URL construction
  private getApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/[feature]`;
  }
  
  // ✅ RULE 6: ALL HTTP methods are async/await
  async loadDataAsync(): Promise<DataType[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      // ✅ RULE 7: Use lastValueFrom + ConfigService for HTTP calls
      const result = await lastValueFrom(
        this.http.get<DataType[]>(this.getApiUrl())
      );
      
      this.dataSignal.set(result);
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load data';
      this.errorSignal.set(errorMsg);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async createItemAsync(item: CreateRequest): Promise<DataType> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const created = await lastValueFrom(
        this.http.post<DataType>(this.getApiUrl(), item)
      );
      
      // ✅ RULE 8: Update signals immutably
      this.dataSignal.update(current => [...current, created]);
      return created;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to create item');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async updateItemAsync(id: number, updates: UpdateRequest): Promise<DataType> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      const updated = await lastValueFrom(
        this.http.put<DataType>(`/api/endpoint/${id}`, updates)
      );
      
      // ✅ RULE 7: Update arrays properly with signals
      this.dataSignal.update(current => 
        current.map(item => item.id === id ? updated : item)
      );
      return updated;
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to update item');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
  
  async deleteItemAsync(id: number): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      await lastValueFrom(
        this.http.delete(`/api/endpoint/${id}`)
      );
      
      // ✅ RULE 8: Remove from arrays with update()
      this.dataSignal.update(current => 
        current.filter(item => item.id !== id)
      );
    } catch (error: any) {
      this.errorSignal.set(error.message || 'Failed to delete item');
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
```

---

## 📋 **MANDATORY Component Pattern**

### **Template: Every Component Must Follow This**

```typescript
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-feature',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feature.html',
  styleUrl: './feature.scss'
})
export class FeatureComponent implements OnInit {
  // ✅ RULE 9: Inject services with inject()
  private service = inject(FeatureService);
  private fb = inject(FormBuilder);
  
  // ✅ RULE 10: Component UI state as signals
  private selectedItemSignal = signal<DataType | null>(null);
  private showFormSignal = signal<boolean>(false);
  
  // ✅ RULE 11: Public readonly signals for template
  public readonly selectedItem = this.selectedItemSignal.asReadonly();
  public readonly showForm = this.showFormSignal.asReadonly();
  
  // ✅ RULE 12: Computed signals for complex UI logic
  public readonly canEdit = computed(() => {
    const item = this.selectedItem();
    const loading = this.service.loading();
    return !!item && !loading;
  });
  
  public readonly canSave = computed(() => {
    return this.form.valid && !this.service.loading();
  });
  
  // ✅ RULE 13: Reactive forms as usual (not signals)
  form: FormGroup;
  
  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  // ✅ RULE 14: Load data on init
  async ngOnInit() {
    await this.service.loadDataAsync();
  }
  
  // ✅ RULE 15: Event handlers are async
  async onSave() {
    if (this.canSave()) {
      try {
        const formValue = this.form.value;
        await this.service.createItemAsync(formValue);
        this.form.reset();
        this.showFormSignal.set(false);
      } catch (error) {
        // Error is handled by service, just log here
        console.error('Save failed:', error);
      }
    }
  }
  
  onSelectItem(item: DataType) {
    this.selectedItemSignal.set(item);
  }
  
  onShowForm() {
    this.showFormSignal.set(true);
  }
  
  onHideForm() {
    this.showFormSignal.set(false);
    this.form.reset();
  }
  
  // ✅ RULE 16: Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
```

---

## 📋 **MANDATORY Template Pattern**

### **Template: Every Template Must Follow This**

```html
<!-- ✅ RULE 17: Direct signal calls in templates -->
<div class="container">
  <!-- Loading State -->
  <div *ngIf="service.loading()" class="flex justify-center p-4">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
  
  <!-- Error State -->
  <div *ngIf="service.error()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
    {{ service.error() }}
  </div>
  
  <!-- Empty State -->
  <div *ngIf="service.isEmpty()" class="text-center py-8 text-gray-500">
    No items found. 
    <button (click)="onShowForm()" class="text-blue-500 hover:text-blue-700">
      Create your first item
    </button>
  </div>
  
  <!-- Data List -->
  <div *ngIf="service.hasData()" class="space-y-4">
    <div *ngFor="let item of service.data()" 
         class="border rounded-lg p-4"
         [class.border-blue-500]="selectedItem()?.id === item.id">
      
      <h3 class="font-semibold">{{ item.name }}</h3>
      <p class="text-gray-600">{{ item.description }}</p>
      
      <div class="mt-3 space-x-2">
        <button (click)="onSelectItem(item)"
                class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
          Select
        </button>
        
        <button (click)="onEdit(item)"
                [disabled]="!canEdit()"
                class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50">
          Edit
        </button>
      </div>
    </div>
  </div>
  
  <!-- Form Section -->
  <div *ngIf="showForm()" class="mt-6 bg-gray-50 p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Create New Item</h2>
    
    <form [formGroup]="form" (ngSubmit)="onSave()">
      <!-- ✅ RULE 18: Standard form validation patterns -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input type="text" 
               formControlName="name"
               class="w-full border rounded-lg px-3 py-2"
               [class.border-red-500]="isFieldInvalid('name')">
        <div *ngIf="isFieldInvalid('name')" class="text-red-500 text-sm mt-1">
          {{ getFieldError('name') }}
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input type="email" 
               formControlName="email"
               class="w-full border rounded-lg px-3 py-2"
               [class.border-red-500]="isFieldInvalid('email')">
        <div *ngIf="isFieldInvalid('email')" class="text-red-500 text-sm mt-1">
          {{ getFieldError('email') }}
        </div>
      </div>
      
      <!-- ✅ RULE 19: Computed signals for button states -->
      <div class="flex space-x-3">
        <button type="submit"
                [disabled]="!canSave()"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
          Save
        </button>
        
        <button type="button"
                (click)="onHideForm()"
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 🚫 **FORBIDDEN PATTERNS**

### **NEVER USE THESE (Legacy Code):**

```typescript
// ❌ FORBIDDEN: BehaviorSubject for state
private dataSubject = new BehaviorSubject<Data[]>([]);
public data$ = this.dataSubject.asObservable();

// ❌ FORBIDDEN: Observable chains in services
loadData(): Observable<Data[]> {
  return this.http.get<Data[]>('/api/data').pipe(
    tap(data => this.dataSubject.next(data)),
    map(data => data.filter(item => item.active))
  );
}

// ❌ FORBIDDEN: Observable subscriptions in components
ngOnInit() {
  this.service.loadData().subscribe(data => {
    this.data = data;
  });
}

// ❌ FORBIDDEN: Async pipe in templates
<div *ngFor="let item of (service.data$ | async)">

// ❌ FORBIDDEN: Observable-based guards
canActivate(): Observable<boolean> {
  return this.authService.currentUser$.pipe(
    map(user => !!user)
  );
}
```

---

## ✅ **Code Review Checklist**

### **Before Merging ANY Code, Verify:**

- [ ] **Service uses ONLY signals** (no BehaviorSubject/Observable for state)
- [ ] **HTTP methods are async/await** with lastValueFrom()
- [ ] **Component state uses signals** (not properties)
- [ ] **Templates call signals directly** with `signal()`
- [ ] **Computed signals used** for derived state
- [ ] **Loading states managed** with signals
- [ ] **Error handling implemented** with signals
- [ ] **Form validation** follows standard pattern
- [ ] **No Observable subscriptions** in components
- [ ] **No async pipes** in templates
- [ ] **TypeScript strict mode** compliance
- [ ] **Proper error handling** in all async methods

---

## 🔧 **Migration Notes**

### **When You Find Legacy Code:**

1. **Identify Pattern**: BehaviorSubject, Observable chains, async pipes
2. **Convert to Signals**: Replace state management with signals
3. **Convert HTTP**: Change to async/await pattern
4. **Update Templates**: Replace async pipes with direct signal calls
5. **Test Thoroughly**: Ensure same functionality with new patterns

### **Example Migration:**

```typescript
// ❌ BEFORE (Legacy)
private dataSubject = new BehaviorSubject<User[]>([]);
public users$ = this.dataSubject.asObservable();

loadUsers(): Observable<User[]> {
  return this.http.get<User[]>('/api/users').pipe(
    tap(users => this.dataSubject.next(users))
  );
}

// ✅ AFTER (Modern)
private usersSignal = signal<User[]>([]);
public readonly users = this.usersSignal.asReadonly();

async loadUsersAsync(): Promise<User[]> {
  const users = await lastValueFrom(
    this.http.get<User[]>('/api/users')
  );
  this.usersSignal.set(users);
  return users;
}
```

---

## 📱 **MANDATORY Mobile-First Development Rules**

### **🎯 Core Mobile Principles**

**EVERY COMPONENT MUST:**
- ✅ Start with mobile design (320px viewport)
- ✅ Use touch-friendly sizes (min 44px targets)
- ✅ Progressive enhancement to desktop
- ✅ Test on actual mobile devices

### **📐 Required Responsive Patterns**

```typescript
// ✅ MANDATORY: Mobile-first Tailwind classes
<button class="
  w-full p-4 text-lg                    // Mobile: full width, touch-friendly
  md:w-auto md:px-6 md:py-3 md:text-base // Desktop: compact
  min-h-[2.75rem]                       // Always touch-friendly
  rounded-lg bg-primary-500 text-white
">
```

### **🎛️ Navigation Rules**

```html
<!-- ✅ MANDATORY: Mobile navigation pattern -->
<!-- Mobile: Bottom tab bar -->
<nav class="
  fixed bottom-0 left-0 right-0 z-50
  md:static md:flex md:justify-center
  bg-white border-t border-slate-200
  safe-area-padding-bottom
">
  <!-- Tab items with minimum 44px touch targets -->
</nav>
```

### **📋 Form Rules Mobile-First**

```typescript
// ✅ MANDATORY: Mobile-optimized form layout
<div class="
  space-y-6                             // Mobile: generous spacing
  md:space-y-4                         // Desktop: compact
  p-4 md:p-6                          // Progressive spacing
">
  <input class="
    w-full p-4 text-lg                 // Mobile: large, easy to tap
    md:p-3 md:text-base               // Desktop: standard
    rounded-lg border-2               // Clear borders for touch
    focus:border-primary-500          // Visual feedback
  ">
</div>
```

### **🚫 Mobile-First Forbidden Patterns**

```html
<!-- ❌ FORBIDDEN: Desktop-first responsive design -->
<div class="hidden md:block lg:flex">

<!-- ❌ FORBIDDEN: Small touch targets -->
<button class="p-1 text-xs">

<!-- ❌ FORBIDDEN: Hover-only interactions -->
<div class="hover:bg-blue-500">

<!-- ❌ FORBIDDEN: Complex nested navigation -->
<nav class="dropdown-menu">
```

### **✅ Mobile-First Checklist**

**Before merging ANY component:**
- [ ] **Tested on 320px viewport** (iPhone SE)
- [ ] **Touch targets minimum 44px** (2.75rem)
- [ ] **Text readable without zoom** (16px+ base)
- [ ] **Forms usable with thumbs** (large inputs)
- [ ] **Navigation works on mobile** (bottom bar/hamburger)
- [ ] **Progressive enhancement** works (mobile → desktop)
- [ ] **Performance optimized** (mobile network)
- [ ] **Uses p-select instead of p-dropdown** (correct component)

### **⚠️ CRITICAL COMPONENT RULES**

**🚫 FORBIDDEN: p-dropdown**
```typescript
// ❌ NEVER USE - p-dropdown is obsolete
import { DropdownModule } from 'primeng/dropdown';
<p-dropdown>
```

**✅ REQUIRED: p-select**
```typescript
// ✅ ALWAYS USE - p-select is the correct component
import { SelectModule } from 'primeng/select';

// ✅ Always make it editable
<p-select 
  [editable]="true"
  [filter]="true"
  [showClear]="true">
```

---

**🎯 REMEMBER: These patterns are not suggestions - they are REQUIREMENTS for all BudgetWise development.**
