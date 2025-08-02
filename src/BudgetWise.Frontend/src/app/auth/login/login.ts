import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  
  // 🚀 MODERN ANGULAR: Signals per gestione stato reattivo
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  returnUrl = '/dashboard';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Pulisci i messaggi quando l'utente inizia a digitare
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set('');
      }
      if (this.successMessage()) {
        this.successMessage.set('');
      }
    });
  }

  ngOnInit(): void {
    console.log('🔴 LOGIN COMPONENT - ngOnInit started');
    
    // Recupera l'URL di ritorno dai query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    console.log('🔴 Return URL:', this.returnUrl);
    
    // Se l'utente è già autenticato, reindirizza
    try {
      const isAuthenticated = this.authService.isUserAuthenticated();
      console.log('🔴 Is authenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('🔴 User already authenticated, redirecting to:', this.returnUrl);
        this.router.navigate([this.returnUrl]);
      }
    } catch (error) {
      console.error('🔴 Error checking authentication:', error);
    }
    
    console.log('🔴 LOGIN COMPONENT - ngOnInit completed');
  }

  async onSubmit(): Promise<void> {
    console.log('🔴 LOGIN DEBUG - Form submit triggered');
    console.log('🔴 Form valid:', this.loginForm.valid);
    console.log('🔴 Form values:', this.loginForm.value);
    console.log('🔴 isLoading:', this.isLoading());

    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      console.log('🔴 Starting login process...');

      const credentials: LoginRequest = this.loginForm.value;
      console.log('🔴 Credentials:', credentials);

      try {
        console.log('🔴 Calling authService.loginAsync...');
        
        // 🚀 MODERN ANGULAR: async/await invece di Observable subscribe
        const response = await this.authService.loginAsync(credentials);
        
        console.log('🔴 Login response received:', response);
        this.isLoading.set(false);
        
        if (response && response.success && response.token) {
          console.log('🔴 Login SUCCESS');
          this.successMessage.set('Login effettuato con successo!');
          
          // Breve delay per mostrare il messaggio di successo
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        } else {
          console.log('🔴 Login FAILED:', response.error || 'Invalid response');
          this.errorMessage.set(response.error || 'Credenziali non valide.');
          this.markFormGroupTouched();
          this.focusFirstInvalidField();
        }
      } catch (error: any) {
        console.error('🔴 Login ERROR:', error);
        this.isLoading.set(false);
        
        // Gestisci gli errori HTTP dal backend
        if (error.status === 400) {
          // 400 = credenziali invalide o errore di validazione
          this.errorMessage.set('Email o password non corretti.');
          this.markFormGroupTouched();
          this.focusFirstInvalidField();
        } else {
          this.handleLoginError(error);
        }
      }
    } else {
      console.log('🔴 Form invalid or loading, marking touched');
      this.markFormGroupTouched();
    }
  }

  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.errorMessage.set('Email o password non corretti.');
    } else if (error.status === 400) {
      this.errorMessage.set(error.error?.message || 'Dati di login non validi.');
    } else if (error.status === 0) {
      this.errorMessage.set('Impossibile connettersi al server. Riprova più tardi.');
    } else {
      this.errorMessage.set('Si è verificato un errore imprevisto. Riprova.');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private focusFirstInvalidField(): void {
    // Focus sul primo campo per dare feedback immediato all'utente
    setTimeout(() => {
      const emailField = document.getElementById('email') as HTMLInputElement;
      if (emailField) {
        emailField.focus();
        emailField.select();
      }
    }, 100);
  }

  // Getter per accesso facile ai controlli del form
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // Metodi di utilità per la validazione
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} è richiesto`;
      if (field.errors['email']) return 'Inserisci un email valida';
      if (field.errors['minlength']) return `${fieldName} deve essere di almeno ${field.errors['minlength'].requiredLength} caratteri`;
    }
    return '';
  }
}
