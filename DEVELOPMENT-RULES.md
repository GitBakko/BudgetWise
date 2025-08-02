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

---

## 📋 **MANDATORY Service Pattern**

### **Template: Every Service Must Follow This**

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class [FeatureName]Service {
  // ✅ RULE 1: ALL state as private signals
  private dataSignal = signal<DataType[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  
  // ✅ RULE 2: Public readonly signals only
  public readonly data = this.dataSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();
  
  // ✅ RULE 3: Computed signals for derived state
  public readonly hasData = computed(() => this.data().length > 0);
  public readonly isEmpty = computed(() => !this.loading() && this.data().length === 0);
  
  constructor(private http: HttpClient) {}
  
  // ✅ RULE 4: ALL HTTP methods are async/await
  async loadDataAsync(): Promise<DataType[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    try {
      // ✅ RULE 5: Use lastValueFrom for HTTP to Promise conversion
      const result = await lastValueFrom(
        this.http.get<DataType[]>('/api/endpoint')
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
        this.http.post<DataType>('/api/endpoint', item)
      );
      
      // ✅ RULE 6: Update signals immutably
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

**🎯 REMEMBER: These patterns are not suggestions - they are REQUIREMENTS for all BudgetWise development.**
