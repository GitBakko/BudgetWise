import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // 🚀 MODERN ANGULAR: Accesso diretto ai signals
  get currentUser() {
    return this.authService.currentUser();
  }

  get userFullName() {
    return this.authService.userFullName();
  }

  /**
   * Effettua il logout e reindirizza al login
   */
  async onLogout(): Promise<void> {
    try {
      console.log('🔴 LOGOUT - Logging out user...');
      
      // Effettua il logout
      this.authService.logout();
      
      console.log('✅ LOGOUT - User logged out successfully');
      
      // Reindirizza al login
      await this.router.navigate(['/auth/login']);
      
      console.log('✅ LOGOUT - Redirected to login');
    } catch (error) {
      console.error('❌ LOGOUT - Error during logout:', error);
    }
  }
}
