import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

/**
 * Interceptor per aggiungere automaticamente il token JWT alle richieste HTTP
 * Compatibile con la configurazione JWT del backend BudgetWise.Api
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService: AuthService = inject(AuthService);
  const token: string | null = authService.getToken();

  // Se c'è un token, lo aggiungiamo all'header Authorization
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};
