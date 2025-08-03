# 🚀 BudgetWise Quick Reference

## 🔧 API Configuration (CRITICAL)

### Service Pattern with ConfigService
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  // ✅ MANDATORY: Use ConfigService for API URLs
  private getApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/feature`;
  }
  
  async loadDataAsync(): Promise<any[]> {
    return await lastValueFrom(
      this.http.get<any[]>(this.getApiUrl())
    );
  }
}
```

### ❌ NEVER Use These Approaches
```typescript
// ❌ WRONG: Hardcoded URLs
this.http.get('/api/data')

// ❌ WRONG: Proxy configuration
// Don't use proxy.conf.json

// ❌ WRONG: Environment variables directly
this.http.get(environment.apiUrl + '/api/data')
```

## Configurazione Base

### Import Essenziali
```typescript
// Component imports - ⚠️ IMPORTANT: Use SelectModule, NOT DropdownModule
import { 
  InputTextModule, 
  ButtonModule, 
  PasswordModule, 
  CheckboxModule,
  SelectModule // ✅ CORRECT: Use SelectModule for dropdowns
} from 'primeng';
import { ReactiveFormsModule, CommonModule } from '@angular/common';
```

### CSS Structure
```scss
:host {
  display: block;
}

:host ::ng-deep {
  .p-inputtext {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: var(--color-primary-500);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }
  }
}
```

## Quick Components

### Card Container
```html
<div class="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
  <!-- Content -->
</div>
```

### Primary Button
```html
<p-button 
  label="Action"
  icon="pi pi-check"
  styleClass="w-full primary-btn"
  size="large"
></p-button>
```

### ⚠️ Select Component (p-select)
**🚫 NON usare p-dropdown!**  
**✅ USA p-select editable:**
```html
<p-select 
  formControlName="field"
  [options]="options"
  optionLabel="label"
  optionValue="value"
  [editable]="true"
  [filter]="true"
  [showClear]="true"
  placeholder="Seleziona..."
  class="w-full">
  
  <ng-template #selectedItem let-option>
    <div *ngIf="option" class="flex items-center gap-2">
      <i [class]="'pi ' + option.icon"></i>
      <span>{{ option.label }}</span>
    </div>
  </ng-template>
</p-select>
```

### Input Field
```html
<div class="space-y-2">
  <label class="block text-sm font-semibold text-slate-700">Label</label>
  <input pInputText class="w-full" placeholder="Placeholder" />
</div>
```

### Success Message
```html
<div class="bg-green-50 border-l-4 border-green-400 rounded-md p-4 flex items-center gap-3">
  <i class="pi pi-check-circle text-green-600 text-lg"></i>
  <span class="text-green-800 text-sm font-medium">Success message</span>
</div>
```

### Error Message
```html
<div class="bg-red-50 border-l-4 border-red-400 rounded-md p-4 flex items-center gap-3">
  <i class="pi pi-exclamation-triangle text-red-600 text-lg"></i>
  <span class="text-red-800 text-sm font-medium">Error message</span>
</div>
```

## Color Palette

### Primary (Green)
- `primary-50` - Background subtle
- `primary-500` - Brand main  
- `primary-600` - Hover/Focus
- `primary-700` - Active

### Neutral (Slate)  
- `slate-50` - Background
- `slate-600` - Secondary text
- `slate-900` - Primary text

### Semantic
- `red-500` - Error
- `green-500` - Success  
- `blue-500` - Info
- `yellow-500` - Warning

## Layout Classes

### Spacing
- `space-y-2` - Vertical spacing small
- `space-y-6` - Vertical spacing normal
- `gap-3` - Flex gap
- `p-4` `p-6` `p-8` - Padding

### Layout
- `flex items-center justify-between`
- `grid grid-cols-1 md:grid-cols-2 gap-6`
- `w-full max-w-md mx-auto`

### Typography
- `text-3xl font-bold text-slate-900` - Main title
- `text-sm font-semibold text-slate-700` - Label
- `text-slate-600` - Secondary text
- `text-xs text-slate-400` - Footnote

## Animations

### Allowed
```scss
transform: translateY(-2px);  // Hover button
transform: scale(1.02);       // Focus input  
transition: all 0.3s ease;   // Standard transition
box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25); // Subtle shadow
```

### Forbidden
```scss
❌ transform: rotate(360deg);
❌ animation: bounce 2s infinite;
❌ transform: scale(1.5);
❌ transition: all 1s;
```

## Check Before Commit

- [ ] Uses PrimeNG components
- [ ] Follows color palette
- [ ] Mobile responsive
- [ ] Subtle animations only
- [ ] ARIA labels present
- [ ] Error states handled
