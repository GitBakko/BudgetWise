import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect alla dashboard se autenticato, altrimenti al login
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Rotte di autenticazione
  { 
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  
  // Dashboard protetta da AuthGuard
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  
  // Catch-all route
  { path: '**', redirectTo: '/dashboard' }
];
