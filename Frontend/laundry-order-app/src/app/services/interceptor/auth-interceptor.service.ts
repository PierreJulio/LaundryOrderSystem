import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  intercept(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
    // Only check for token in browser environment
    if (this.isBrowser) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const token = JSON.parse(currentUser).token;
        if (token) {
          // Clone the request and replace the original headers with
          // cloned headers, updated with the authorization
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
          });
          // Send cloned request with header to the next handler
          return next(authReq);
        }
      }
    }
    // If no token found or not browser, just pass the request through
    return next(req);
  }
}
