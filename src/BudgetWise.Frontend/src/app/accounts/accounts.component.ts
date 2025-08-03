import { Component, inject, OnInit, AfterViewInit, ChangeDetectorRef, signal, computed } from '@angular/core';
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
import { ConfirmationService } from 'primeng/api';

// Services
import { AccountService } from '../core/services/account.service';

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
    ConfirmDialogModule
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

  // ✅ RULE: Component UI state as signals
  private selectedAccountSignal = signal<any | null>(null);
  private showFormSignal = signal<boolean>(false);
  private showDetailsSignal = signal<boolean>(false);
  private editModeSignal = signal<boolean>(false);

  // ✅ RULE: Public readonly signals for template
  public readonly selectedAccount = this.selectedAccountSignal.asReadonly();
  public readonly showForm = this.showFormSignal.asReadonly();
  public readonly showDetails = this.showDetailsSignal.asReadonly();
  public readonly editMode = this.editModeSignal.asReadonly();

  // ✅ RULE: Computed signals for complex UI logic
  public readonly canEdit = computed(() => {
    const account = this.selectedAccount();
    const loading = this.accountService.loading();
    return !!account && !loading;
  });

  public readonly canSave = computed(() => {
    return this.accountForm.valid && !this.accountService.loading();
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
      description: ['']
    });
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

  // ✅ MOBILE-FIRST: Touch-friendly event handlers
  onCreateAccount() {
    this.editModeSignal.set(false);
    this.selectedAccountSignal.set(null);
    this.accountForm.reset();
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
        
        if (this.editMode()) {
          const account = this.selectedAccount();
          await this.accountService.updateAccountAsync(account!.id, formValue);
        } else {
          await this.accountService.createAccountAsync(formValue);
        }
        
        this.accountForm.reset();
        this.showFormSignal.set(false);
        this.editModeSignal.set(false);
        this.selectedAccountSignal.set(null);
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
  }

  onCancel() {
    this.showFormSignal.set(false);
    this.showDetailsSignal.set(false);
    this.editModeSignal.set(false);
    this.accountForm.reset();
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

  // Helper to get account type info
  getAccountTypeInfo(accountType: string): AccountType {
    return this.accountTypes.find(type => type.value === accountType) || this.accountTypes[0];
  }
}
