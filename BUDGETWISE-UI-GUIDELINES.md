# 🎨 BudgetWise UI Design System & Component Guidelines

## 📋 Indice
- [Filosofia di Design](#filosofia-di-design)
- [Stack Tecnologico](#stack-tecnologico)
- [Sistema di Colori](#sistema-di-colori)
- [Componenti Base](#componenti-base)
- [Layout e Spacing](#layout-e-spacing)
- [Animazioni e Transizioni](#animazioni-e-transizioni)
- [Best Practices](#best-practices)
- [Esempi di Codice](#esempi-di-codice)

---

## 🎯 Filosofia di Design

### **Equilibrio: Professionalità + Carattere**
BudgetWise adotta un approccio **"Professional Modern"** che bilancia:

✅ **PROFESSIONALITÀ** (60%)
- Interfaccia seria e affidabile per una app finanziaria
- Layout puliti e ordinati
- Tipografia leggibile e gerarchie chiare
- Colori sobri come base

✅ **CARATTERE** (40%)
- Gradienti sottili per aggiungere personalità
- Micro-animazioni che migliorano l'UX
- Colori brand strategicamente posizionati
- Dettagli moderni (ombre, arrotondamenti)

### **Principi Fondamentali**
1. **📱 MOBILE-FIRST** - Design primario per dispositivi mobili
2. **Funzionalità prima dell'estetica**
3. **Coerenza visiva** in tutti i componenti
4. **Accessibilità WCAG 2.1** come standard
5. **Performance** - animazioni hardware-accelerated
6. **Responsive design** con breakpoint strategici

---

## 🔧 Stack Tecnologico

### **Framework & Librerie**
```typescript
// Core
- Angular 20+ (Signals, Zoneless Change Detection)
- TypeScript (strict mode)

// UI Components
- PrimeNG 20.0.1+ (Sistema di componenti)
- @primeng/themes 20.0.1+ (Sistema di temi)
- PrimeIcons (Iconografia)

// Styling
- Tailwind CSS 4+ (Utility-first)
- tailwindcss-primeui (Integrazione PrimeNG)
- SCSS (Per stili custom avanzati)
```

### **Configurazione Obbligatoria**

#### **tailwind.config.js**
```javascript
import PrimeUI from 'tailwindcss-primeui';

export default {
  content: ["./src/**/*.{html,ts}"],
  plugins: [PrimeUI]
};
```

#### **styles.scss**
```scss
/* Configurazione base obbligatoria */
@use "tailwindcss";
@import "primeicons/primeicons.css";

/* Variabili brand BudgetWise */
:root {
  --color-primary-50: #f0fdf4;
  --color-primary-500: #22c55e;
  --color-primary-600: #16a34a;
  --color-primary-700: #15803d;
}
```

#### **app.config.ts**
```typescript
import { providePrimeNG } from 'primeng/config';
import { BudgetWisePreset } from './shared/themes/budgetwise.theme';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: BudgetWisePreset,
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          }
        }
      }
    })
  ]
};
```

---

## 🎨 Sistema di Colori

### **Palette Primaria (Verde)**
```scss
// Verde BudgetWise - Uso principale
primary-50   #f0fdf4  // Background sottili
primary-100  #dcfce7  // Hover states
primary-500  #22c55e  // Brand principale
primary-600  #16a34a  // Hover/Focus
primary-700  #15803d  // Active states
```

### **Palette Neutra (Slate)**
```scss
// Grigi moderni - Uso strutturale
slate-50     #f8fafc  // Background
slate-200    #e2e8f0  // Bordi
slate-600    #475569  // Testo secondario
slate-900    #0f172a  // Testo principale
```

### **Palette Funzionale**
```scss
// Colori semantici
red-500      #ef4444  // Errori
green-500    #22c55e  // Successo
blue-500     #3b82f6  // Info
yellow-500   #eab308  // Warning
```

### **Utilizzo dei Colori**

#### ✅ **CORRETTO**
```html
<!-- Background con gradiente sottile -->
<div class="bg-gradient-to-br from-slate-50 to-primary-50">

<!-- Button principale con gradiente brand -->
<p-button styleClass="bg-gradient-to-r from-primary-500 to-primary-600">

<!-- Testo con gerarchia -->
<h1 class="text-slate-900">Titolo</h1>
<p class="text-slate-600">Sottotitolo</p>
```

#### ❌ **EVITARE**
```html
<!-- Gradienti troppo appariscenti -->
<div class="bg-gradient-to-r from-pink-500 to-blue-500">

<!-- Colori troppo saturi -->
<button class="bg-red-600 text-yellow-300">

<!-- Contrasti insufficienti -->
<span class="text-gray-400 bg-gray-300">
```

---

## 🧩 Componenti Base

### **Card Container Standard**
```html
<div class="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm">
  <!-- Contenuto -->
</div>
```

### **Input Fields PrimeNG**
```html
<div class="space-y-2">
  <label class="block text-sm font-semibold text-slate-700">Label</label>
  <input 
    pInputText 
    class="w-full"
    placeholder="Placeholder text"
  />
</div>
```

### **Button Principale**
```html
<p-button 
  label="Azione Principale"
  icon="pi pi-check"
  styleClass="w-full login-btn"
  size="large"
></p-button>
```

### **⚠️ IMPORTANTE: Select Component (p-select)**
**🚫 NON usare p-dropdown - È obsoleto!**  
**✅ USA SEMPRE p-select - È il componente corretto**

```html
<!-- ✅ CORRETTO: p-select editable con filtro -->
<p-select 
  formControlName="fieldName"
  [options]="options"
  optionLabel="label"
  optionValue="value"
  placeholder="Seleziona un'opzione"
  [editable]="true"
  [showClear]="true"
  [filter]="true"
  filterBy="label"
  class="w-full">
  
  <!-- Template per l'elemento selezionato -->
  <ng-template #selectedItem let-selectedOption>
    <div *ngIf="selectedOption" class="flex items-center gap-2">
      <i [class]="'pi ' + selectedOption.icon"></i>
      <span>{{ selectedOption.label }}</span>
    </div>
  </ng-template>
  
  <!-- Template per gli elementi della lista -->
  <ng-template #item let-option>
    <div class="flex items-center gap-2 p-2">
      <i [class]="'pi ' + option.icon"></i>
      <span>{{ option.label }}</span>
    </div>
  </ng-template>
</p-select>
```

**🎯 Proprietà essenziali per p-select:**
- `[editable]="true"` - Permette digitazione manuale
- `[filter]="true"` - Abilita ricerca nelle opzioni
- `[showClear]="true"` - Mostra pulsante di pulizia
- `filterBy="label"` - Campo su cui filtrare
- Templates personalizzati per icone e layout

**📱 Mobile-First per p-select:**
```scss
::ng-deep .p-select {
  @apply min-h-[3rem]; // Touch-friendly
  
  .p-select-dropdown {
    @apply min-w-[3rem]; // Touch target
  }
}
```

### **Messaggi di Sistema**
```html
<!-- Successo -->
<div class="bg-green-50 border-l-4 border-green-400 rounded-md p-4 flex items-center gap-3">
  <i class="pi pi-check-circle text-green-600 text-lg"></i>
  <span class="text-green-800 text-sm font-medium">Messaggio</span>
</div>

<!-- Errore -->
<div class="bg-red-50 border-l-4 border-red-400 rounded-md p-4 flex items-center gap-3">
  <i class="pi pi-exclamation-triangle text-red-600 text-lg"></i>
  <span class="text-red-800 text-sm font-medium">Errore</span>
</div>
```

---

## � Mobile-First Design Strategy

### **📋 Principio Fondamentale**
BudgetWise è **primariamente una mobile app**. Tutti i componenti devono essere progettati per dispositivi mobili e poi scalare verso desktop.

### **📏 Breakpoint Strategici**
```scss
// Tailwind CSS breakpoints (mobile-first)
sm:   640px   // Piccoli tablet portrait
md:   768px   // Tablet landscape / Desktop piccoli
lg:   1024px  // Desktop standard
xl:   1280px  // Desktop grandi
2xl:  1536px  // Desktop molto grandi
```

### **👆 Touch-First Interaction**
```scss
// Target sizes minimi (44px = 2.75rem)
.touch-target {
  @apply min-h-[2.75rem] min-w-[2.75rem] 
         flex items-center justify-center
         touch-manipulation; // Migliora performance touch
}

// Spacing generoso per touch
.mobile-form {
  @apply space-y-6; // Almeno 1.5rem tra elementi
}
```

### **📱 Mobile-First Component Pattern**
```html
<!-- Base mobile + progressive enhancement -->
<button class="
  w-full p-4 text-lg                    <!-- Mobile: full width, grande -->
  md:w-auto md:px-6 md:py-3 md:text-base <!-- Desktop: auto width, normale -->
  rounded-lg bg-primary-500 text-white
  active:scale-95 transform transition-transform
">
  Conferma
</button>
```

### **🎛️ Navigation Mobile-First**
```html
<!-- Mobile: Bottom navigation -->
<nav class="
  fixed bottom-0 left-0 right-0 
  md:static md:flex md:justify-center
  bg-white border-t border-slate-200
">
  <!-- Tab navigation per mobile -->
</nav>
```

---

## �📐 Layout e Spacing

### **Sistema di Spaziature**
```scss
// Spacing scale Tailwind
space-1     0.25rem   // Dettagli minimi
space-2     0.5rem    // Elementi vicini
space-4     1rem      // Sezioni correlate
space-6     1.5rem    // Gruppi distinti
space-8     2rem      // Sezioni principali
space-12    3rem      // Macro-sezioni
```

### **Layout Responsive**
```html
<!-- Mobile-first approach -->
<div class="w-full max-w-md mx-auto p-4 md:max-w-lg lg:max-w-xl xl:max-w-2xl">
  <!-- Contenuto -->
</div>
```

### **Grid System**
```html
<!-- Form layout responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Campo 1</div>
  <div>Campo 2</div>
</div>
```

---

## ✨ Animazioni e Transizioni

### **Transizioni Standard**
```scss
/* Durate consigliate */
transition-colors     // 150ms - Hover colori
transition-all        // 200ms - Trasformazioni semplici
duration-300         // 300ms - Transizioni complesse

/* Easing consigliate */
ease-out             // Per entrate
ease-in              // Per uscite
ease-in-out          // Per trasformazioni
```

### **Micro-animazioni Consentite**
```scss
// Transform sottili
transform: translateY(-2px);  // Hover button
transform: scale(1.02);       // Focus input

// Ombre dinamiche
box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);

// Slide-in per contenuti
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### **Animazioni da EVITARE**
```scss
❌ transform: rotate(360deg);    // Rotazioni complete
❌ animation: bounce 2s infinite; // Loop infiniti
❌ transform: scale(1.5);        // Scale eccessive
❌ transition: all 1s;           // Durate troppo lunghe
```

---

## ⚡ Best Practices

### **Struttura Componenti**
```typescript
// component.ts
@Component({
  selector: 'app-nome-componente',
  templateUrl: './nome-componente.html',
  styleUrl: './nome-componente.scss',
  standalone: true,
  imports: [
    // PrimeNG modules
    InputTextModule,
    ButtonModule,
    // Angular modules
    ReactiveFormsModule,
    CommonModule
  ]
})
export class NomeComponente {
  // Signals per stato reattivo
  isLoading = signal(false);
  errorMessage = signal('');
  
  // Form reactive
  form = this.fb.group({
    campo: ['', [Validators.required]]
  });
}
```

### **SCSS Component Structure**
```scss
/* component.scss - Template standard */

:host {
  display: block;
}

/* Stili PrimeNG custom */
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
  
  .p-button.primary-btn {
    background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
    border: none;
    border-radius: 12px;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
    }
  }
}

/* Responsive design */
@media (max-width: 640px) {
  // Mobile adjustments
}
```

### **Naming Conventions**
```scss
// CSS Classes
.component-name       // Componente principale
.component-name__element  // Elemento del componente
.component-name--modifier // Variante del componente

// Esempi
.login-form
.login-form__input
.login-form--loading
```

---

## 🏗️ Esempi di Codice

### **Form Completo**
```html
<div class="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
  <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
    
    <!-- Campo Input -->
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700">
        Campo Obbligatorio
      </label>
      <input 
        pInputText 
        formControlName="campo"
        placeholder="Inserisci valore"
        [class.p-invalid]="isFieldInvalid('campo')"
        class="w-full"
      />
      @if (isFieldInvalid('campo')) {
        <small class="text-red-500 text-sm flex items-center gap-1">
          <i class="pi pi-exclamation-triangle text-xs"></i>
          {{ getFieldError('campo') }}
        </small>
      }
    </div>
    
    <!-- Submit Button -->
    <p-button 
      type="submit"
      label="Salva"
      icon="pi pi-check"
      [disabled]="form.invalid || isLoading()"
      [loading]="isLoading()"
      styleClass="w-full primary-btn"
      size="large"
    ></p-button>
  </form>
</div>
```

### **Lista con Card**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  @for (item of items(); track item.id) {
    <div class="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900">{{ item.title }}</h3>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {{ item.status }}
        </span>
      </div>
      <p class="text-slate-600 text-sm mb-4">{{ item.description }}</p>
      <div class="flex gap-3">
        <p-button 
          label="Modifica" 
          [text]="true" 
          icon="pi pi-pencil"
          (onClick)="edit(item)"
          styleClass="p-0 text-primary-600"
        ></p-button>
        <p-button 
          label="Elimina" 
          [text]="true" 
          icon="pi pi-trash"
          (onClick)="delete(item)"
          styleClass="p-0 text-red-600"
        ></p-button>
      </div>
    </div>
  }
</div>
```

---

## 🎯 Checklist Pre-Development

Prima di creare un nuovo componente, verifica:

### **Design**
- [ ] Il componente rispetta la filosofia "Professional Modern"?
- [ ] I colori utilizzati sono dalla palette approvata?
- [ ] Le animazioni sono sottili e funzionali?
- [ ] Il layout è responsive mobile-first?

### **Codice**
- [ ] Usa Angular Signals per lo stato reattivo?
- [ ] Implementa Reactive Forms per gli input?
- [ ] Usa PrimeNG per i componenti UI?
- [ ] Le classi CSS seguono le naming conventions?

### **Performance**
- [ ] Le animazioni sono hardware-accelerated?
- [ ] Il bundle size è ottimizzato?
- [ ] Lazy loading implementato dove necessario?

### **Accessibilità**
- [ ] ARIA labels presenti?
- [ ] Navigazione da tastiera funzionante?
- [ ] Contrasti WCAG 2.1 rispettati?
- [ ] Screen reader compatibility?

---

## 📚 Risorse Aggiuntive

- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Versione:** 1.0  
**Ultima modifica:** Agosto 2025  
**Autore:** GitHub Copilot  
**Progetto:** BudgetWise Financial Management Platform
