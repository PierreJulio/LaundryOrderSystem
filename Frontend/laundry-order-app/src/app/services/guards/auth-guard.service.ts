import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    if (this.authService.isAuthenticated()) {
      // Check if route has data with roles specified
      const roles = route.data['roles'] as Array<string>;
      if (roles) {
        // Check if user has the required role
        const currentUser = this.authService.currentUserValue;
        const hasRole = currentUser?.roles?.some(role => roles.includes(role));
        
        if (!hasRole) {
          // Redirect to login if user doesn't have the required role
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      }
      return true;
    }
    
    // Not logged in, redirect to login page with return url
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  };
}
