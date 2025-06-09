import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authErrorInterceptor } from './services/interceptor/auth-error-interceptor.service';

// Create the auth interceptor function that respects SSR environment
function authInterceptor(req: any, next: any) {
  // Only add the token in the browser environment
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const token = JSON.parse(currentUser).token;
      if (token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(authReq);
      }
    }
  }
  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, authErrorInterceptor])
    ),
    provideAnimations(),
    providePrimeNG({ 
      theme: { 
        preset: Lara,
        options: {
          darkModeSelector: '.dark-mode', // Desactive mode sombre 
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
