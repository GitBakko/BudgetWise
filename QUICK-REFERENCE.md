# 🚀 BudgetWise Quick Reference

## Configurazione Base

### Import Essenziali
```typescript
// Component imports
import { InputTextModule, ButtonModule, PasswordModule, CheckboxModule } from 'primeng';
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
