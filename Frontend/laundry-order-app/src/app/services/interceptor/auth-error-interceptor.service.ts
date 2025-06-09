import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthErrorInterceptorService {

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expiré ou invalide - déconnexion automatique
          console.log('Erreur 401 détectée - Token expiré ou invalide');
          this.authService.logoutDueToExpiration();
        }
        
        return throwError(() => error);
      })
    );
  }
}

// Fonction intercepteur pour l'utilisation dans app.config.ts
export function authErrorInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('Erreur 401 détectée - Token expiré ou invalide');
        
        // Nettoyer le localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('currentUser');
        }
        
        // Rediriger vers la page de connexion avec un message
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname;
          const message = encodeURIComponent('Votre session a expiré. Veuillez vous reconnecter.');
          window.location.href = `/login?message=${message}&returnUrl=${encodeURIComponent(currentUrl)}`;
        }
      }
      
      return throwError(() => error);
    })
  );
}
