import { Component, inject, OnInit, AfterViewInit, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Imports - Mobile-First Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select'; // ✅ CORRECT: Use SelectModule, not DropdownModule
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FileUploadModule } from 'primeng/fileupload';
import { CarouselModule } from 'primeng/carousel';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService } from 'primeng/api';

// Services
import { AccountService } from '../core/services/account.service';
import { IconService, BrandSuggestion, IconGenerationResult } from '../core/services/icon.service';
import { DebounceService } from '../core/services/debounce.service';

// Types
interface AccountType {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-accounts',
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule, // ✅ CORRECT: SelectModule instead of DropdownModule
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    DatePickerModule,
    ColorPickerModule,
    FileUploadModule,
    CarouselModule,
    SkeletonModule,
    CheckboxModule
  ],
  providers: [ConfirmationService],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit, AfterViewInit {
  // ✅ RULE: Inject services with inject()
  public readonly accountService = inject(AccountService); // Made public for template access
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);
  public iconService = inject(IconService);
  private debounceService = inject(DebounceService);

  // ✅ RULE: Component UI state as signals
  private selectedAccountSignal = signal<any | null>(null);
  private showFormSignal = signal<boolean>(false);
  private showDetailsSignal = signal<boolean>(false);
  private editModeSignal = signal<boolean>(false);

  // 🎨 NEW: Icon and brand management signals
  private pendingUploadUriSignal = signal<string | null>(null);
  private selectedColorSignal = signal<string>('#0066CC');
  private brandSuggestionsSignal = signal<BrandSuggestion[]>([]);
  private showIconOptionsSignal = signal<boolean>(false);
  private isGeneratingIconSignal = signal<boolean>(false);

  // ✅ RULE: Public readonly signals for template
  public readonly selectedAccount = this.selectedAccountSignal.asReadonly();
  public readonly showForm = this.showFormSignal.asReadonly();
  public readonly showDetails = this.showDetailsSignal.asReadonly();
  public readonly editMode = this.editModeSignal.asReadonly();
  
  // 🎨 NEW: Public readonly signals for icon management
  public readonly pendingUploadUri = this.pendingUploadUriSignal.asReadonly();
  public readonly selectedColor = this.selectedColorSignal.asReadonly();
  public readonly brandSuggestions = this.brandSuggestionsSignal.asReadonly();
  public readonly showIconOptions = this.showIconOptionsSignal.asReadonly();
  public readonly isGeneratingIcon = this.isGeneratingIconSignal.asReadonly();

  // ✅ RULE: Computed signals for complex UI logic
  public readonly canEdit = computed(() => {
    const account = this.selectedAccount();
    const loading = this.accountService.loading();
    return !!account && !loading;
  });

  public readonly canSave = computed(() => {
    const isFormValid = this.accountForm.valid;
    const isNotLoading = !this.accountService.loading();
    
    // Debug logging per troubleshooting
    console.log('🔧 CanSave Debug:', {
      formValid: isFormValid,
      formStatus: this.accountForm.status,
      formErrors: this.accountForm.errors,
      nameValid: this.accountForm.get('name')?.valid,
      nameValue: this.accountForm.get('name')?.value,
      accountTypeValid: this.accountForm.get('accountType')?.valid,
      accountTypeValue: this.accountForm.get('accountType')?.value,
      balanceValid: this.accountForm.get('balance')?.valid,
      balanceValue: this.accountForm.get('balance')?.value,
      notLoading: isNotLoading
    });
    
    return isFormValid && isNotLoading;
  });

  public readonly canDelete = computed(() => {
    const account = this.selectedAccount();
    const loading = this.accountService.loading();
    return !!account && !loading;
  });

  public readonly formTitle = computed(() => {
    return this.editMode() ? 'Modifica Conto' : 'Nuovo Conto';
  });

  // Account types dropdown data
  public readonly accountTypes: AccountType[] = [
    { label: 'Conto Corrente', value: 'checking', icon: 'pi-credit-card' },
    { label: 'Carta di Credito', value: 'credit', icon: 'pi-credit-card' },
    { label: 'Contanti', value: 'cash', icon: 'pi-money-bill' },
    { label: 'Investimenti', value: 'investment', icon: 'pi-chart-line' },
    { label: 'Risparmi', value: 'savings', icon: 'pi-bookmark' }
  ];

  // ✅ RULE: Reactive forms as usual (not signals)
  accountForm: FormGroup;

  constructor() {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      accountType: ['', [Validators.required]],
      balance: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      // 🎨 NEW: Advanced fields from guide
      color: ['#0066CC', [Validators.required]],
      balanceStartDate: [new Date(), [Validators.required]],
      setAsDefault: [false]
    });

    // 🔧 FIX: Trigger change detection when form values change
    this.accountForm.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    this.accountForm.statusChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    // 🎨 NEW: Setup debounced search for brand logos
    this.setupBrandSearch();
  }

  // ✅ RULE: Load data on init
  async ngOnInit() {
    await this.accountService.loadAccountsAsync();
  }

  // ✅ RULE: Fix expression changed after checked error
  ngAfterViewInit() {
    // Ensure change detection is stable after view initialization
    this.cdr.detectChanges();
  }

  // 🎨 NEW: Setup debounced brand search from guide
  private setupBrandSearch(): void {
    // Listen to name field changes for brand logo suggestions with debounce
    this.accountForm.get('name')?.valueChanges.subscribe(value => {
      if (value && value.length >= 2) {
        // 🔥 NEW: Use debounced search instead of immediate
        this.iconService.searchBrandLogosDebounced(value);
      } else {
        this.brandSuggestionsSignal.set([]);
        this.showIconOptionsSignal.set(false);
      }
    });

    // 🔥 NEW: Effect to react to brand suggestions changes
    effect(() => {
      const suggestions = this.iconService.brandSuggestions();
      this.brandSuggestionsSignal.set(suggestions);
      
      // Show icon options if we have suggestions
      if (suggestions.length > 0) {
        this.showIconOptionsSignal.set(true);
      }
    });
  }

  // ✅ MOBILE-FIRST: Touch-friendly event handlers
  onCreateAccount() {
    this.editModeSignal.set(false);
    this.selectedAccountSignal.set(null);
    this.accountForm.reset({
      name: '',
      accountType: '',
      balance: 0,
      description: '',
      color: '#0066CC',
      balanceStartDate: new Date(),
      setAsDefault: false
    });
    this.resetIconState();
    this.showFormSignal.set(true);
  }

  onSelectAccount(account: any) {
    this.selectedAccountSignal.set(account);
    this.showDetailsSignal.set(true);
  }

  onEditAccount(account: any) {
    this.editModeSignal.set(true);
    this.selectedAccountSignal.set(account);
    
    // Populate form with existing data
    this.accountForm.patchValue({
      name: account.name,
      accountType: account.accountType,
      balance: account.balance,
      description: account.description
    });
    
    this.showFormSignal.set(true);
    this.showDetailsSignal.set(false);
  }

  onDeleteAccount(account: any) {
    this.confirmationService.confirm({
      message: `Sei sicuro di voler eliminare il conto "${account.name}"?`,
      header: 'Conferma Eliminazione',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Elimina',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.accountService.deleteAccountAsync(account.id);
          this.selectedAccountSignal.set(null);
          this.showDetailsSignal.set(false);
        } catch (error) {
          console.error('Delete failed:', error);
        }
      }
    });
  }

  // ✅ RULE: Event handlers are async
  async onSave() {
    if (this.canSave()) {
      try {
        const formValue = this.accountForm.value;
        
        // 🎨 NEW: Include pending icon data in request
        const accountData = {
          ...formValue,
          pendingUploadUri: this.pendingUploadUri(),
          iconId: null // Will be set by backend after upload
        };
        
        if (this.editMode()) {
          const account = this.selectedAccount();
          await this.accountService.updateAccountAsync(account!.id, accountData);
        } else {
          await this.accountService.createAccountAsync(accountData);
        }
        
        this.accountForm.reset();
        this.showFormSignal.set(false);
        this.editModeSignal.set(false);
        this.selectedAccountSignal.set(null);
        this.resetIconState();
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
  }

  /**
   * Reset icon-related state
   */
  private resetIconState(): void {
    this.pendingUploadUriSignal.set(null);
    this.selectedColorSignal.set('#0066CC');
    this.brandSuggestionsSignal.set([]);
    this.showIconOptionsSignal.set(false);
    this.isGeneratingIconSignal.set(false);
    this.iconService.reset();
  }

  onCancel() {
    this.showFormSignal.set(false);
    this.showDetailsSignal.set(false);
    this.editModeSignal.set(false);
    this.accountForm.reset();
    this.resetIconState();
  }

  onDialogVisibilityChange(visible: boolean) {
    if (!visible && this.showForm()) {
      // Il dialog si è chiuso, esegui la logica di cancellazione
      this.onCancel();
    }
  }

  onDetailsDialogVisibilityChange(visible: boolean) {
    if (!visible && this.showDetails()) {
      // Il dialog dei dettagli si è chiuso
      this.onBackToList();
    }
  }

  onBackToList() {
    this.showDetailsSignal.set(false);
    this.selectedAccountSignal.set(null);
  }

  // ✅ RULE: Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.accountForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.accountForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} è obbligatorio`;
      if (field.errors['minlength']) return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
      if (field.errors['min']) return `Il valore deve essere positivo`;
    }
    return '';
  }

  // 📱 MOBILE: Navigate to transactions for this account
  onViewTransactions(account: any) {
    this.router.navigate(['/transactions'], { 
      queryParams: { accountId: account.id } 
    });
  }

  // 🎨 NEW: Icon and brand management methods from guide

  /**
   * Handle brand logo selection from suggestions
   * Implements getBrandDetailsFlow from guide with robust error handling
   */
  async onSelectBrandLogo(brand: BrandSuggestion): Promise<void> {
    try {
      if (brand.source === 'brandfetch') {
        // Get detailed brand info with colors and high-quality logo
        const details = await this.iconService.getBrandDetails(brand.id);
        if (details) {
          this.pendingUploadUriSignal.set(details.dataUri);
          this.selectedColorSignal.set(details.color);
          this.accountForm.patchValue({
            color: details.color,
            name: brand.name
          });
        } else {
          // Fallback se getBrandDetails fallisce completamente
          console.warn('Fallback: generazione icona AI per', brand.name);
          const fallbackIcon = await this.iconService.generateAccountIcon(brand.name, 'modern');
          if (fallbackIcon) {
            this.pendingUploadUriSignal.set(fallbackIcon.dataUri);
            this.selectedColorSignal.set(fallbackIcon.color);
            this.accountForm.patchValue({
              color: fallbackIcon.color,
              name: brand.name
            });
          }
        }
      } else {
        // Per brand locali, processa il logo esterno tramite backend
        if (brand.logoUrl && brand.logoUrl.startsWith('http')) {
          const processedLogo = await this.iconService.processExternalLogo(brand.logoUrl);
          if (processedLogo) {
            this.pendingUploadUriSignal.set(processedLogo.dataUri);
            this.selectedColorSignal.set(processedLogo.color);
            this.accountForm.patchValue({ 
              color: processedLogo.color,
              name: brand.name 
            });
          }
        } else {
          // Use local brand data direttamente se è già un dataURI
          this.pendingUploadUriSignal.set(brand.logoUrl);
          if (brand.color) {
            this.selectedColorSignal.set(brand.color);
            this.accountForm.patchValue({ 
              color: brand.color,
              name: brand.name 
            });
          }
        }
      }
      
      this.showIconOptionsSignal.set(false);
    } catch (error) {
      console.error('Error selecting brand logo:', error);
      
      // Ultimate fallback: genera sempre un'icona AI
      try {
        const fallbackIcon = await this.iconService.generateAccountIcon(brand.name, 'modern');
        if (fallbackIcon) {
          this.pendingUploadUriSignal.set(fallbackIcon.dataUri);
          this.selectedColorSignal.set(fallbackIcon.color);
          this.accountForm.patchValue({
            color: fallbackIcon.color,
            name: brand.name
          });
        }
      } catch (fallbackError) {
        console.error('Anche il fallback è fallito:', fallbackError);
      }
      
      this.showIconOptionsSignal.set(false);
    }
  }

  /**
   * Generate AI icon based on account name
   */
  async onGenerateAIIcon(): Promise<void> {
    const accountName = this.accountForm.get('name')?.value;
    if (!accountName) {
      return;
    }

    this.isGeneratingIconSignal.set(true);
    
    try {
      const result = await this.iconService.generateAccountIcon(accountName);
      if (result) {
        this.pendingUploadUriSignal.set(result.dataUri);
        this.selectedColorSignal.set(result.color);
        this.accountForm.patchValue({ color: result.color });
      }
    } catch (error) {
      console.error('Error generating AI icon:', error);
    } finally {
      this.isGeneratingIconSignal.set(false);
    }
  }

  /**
   * Handle manual file upload
   */
  async onFileUpload(event: any): Promise<void> {
    const file = event.files[0];
    if (!file) return;

    try {
      const dataUri = await this.iconService.fileToDataUri(file);
      this.pendingUploadUriSignal.set(dataUri);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  /**
   * Handle color selection
   */
  onColorSelect(color: string): void {
    this.selectedColorSignal.set(color);
    this.accountForm.patchValue({ color });
  }

  /**
   * Get suggested colors for current account name
   */
  getSuggestedColors(): string[] {
    const accountName = this.accountForm.get('name')?.value || '';
    return this.iconService.generateSuggestedColors(accountName);
  }

  /**
   * Clear pending icon and reset to default
   */
  onClearIcon(): void {
    this.pendingUploadUriSignal.set(null);
    this.selectedColorSignal.set('#0066CC');
    this.accountForm.patchValue({ color: '#0066CC' });
  }

  /**
   * Toggle icon options panel
   */
  onToggleIconOptions(): void {
    this.showIconOptionsSignal.set(!this.showIconOptions());
  }

  // Helper to get account type info
  getAccountTypeInfo(accountType: string): AccountType {
    return this.accountTypes.find(type => type.value === accountType) || this.accountTypes[0];
  }
}
