import { Injectable, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timer, takeUntil } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private apiUrl = 'http://localhost:5085/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private isBrowser: boolean;
  private tokenCheckTimer: any;
  private destroy$ = new Subject<void>();  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    let storedUser = null;
    
    if (this.isBrowser) {
      storedUser = localStorage.getItem('currentUser');
      storedUser = storedUser ? JSON.parse(storedUser) : null;
      
      // Vérifier si le token stocké est encore valide (désactivé temporairement pour debug)
       if (storedUser && this.isTokenExpired(storedUser.tokenExpiration)) {
        localStorage.removeItem('currentUser');
        storedUser = null;
      } 
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    // Démarrer la vérification périodique du token si un utilisateur est connecté (désactivé temporairement)
     if (storedUser) {
      this.startTokenExpirationCheck();
    } 
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(
        tap(response => this.handleAuthentication(response))
      );
  }
  logout(): void {
    this.stopTokenExpirationCheck();
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    // Simplifier temporairement pour debug
    //return !!(user?.token);
     return !!(user?.token && !this.isTokenExpired(user.tokenExpiration));
  }

  isAdmin(): boolean {
    return this.currentUserValue?.roles?.includes('Admin') ?? false;
  }
  isTokenExpired(tokenExpiration?: string): boolean {
    if (!tokenExpiration) return true;
    
    try {
      const expirationDate = new Date(tokenExpiration);
      const now = new Date();
      
      // Ajouter une marge de 30 secondes pour éviter les problèmes de timing
      const bufferTime = 30 * 1000; // 30 secondes en millisecondes
      const expirationWithBuffer = new Date(expirationDate.getTime() - bufferTime);
      
      console.log('Vérification expiration token:', {
        now: now.toISOString(),
        expiration: expirationDate.toISOString(),
        expirationWithBuffer: expirationWithBuffer.toISOString(),
        isExpired: now >= expirationWithBuffer
      });
      
      return now >= expirationWithBuffer;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'expiration du token:', error);
      return true; // Considérer comme expiré si erreur de parsing
    }
  }

  logoutDueToExpiration(): void {
    console.log('Token expiré - déconnexion automatique');
    this.forceLogout();
  }

  forceLogout(): void {
    this.stopTokenExpirationCheck();
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], { 
      queryParams: { 
        message: 'Votre session a expiré. Veuillez vous reconnecter.' 
      } 
    });
  }

  private startTokenExpirationCheck(): void {
    this.stopTokenExpirationCheck();
    
    // Vérifier le token toutes les 30 secondes
    this.tokenCheckTimer = timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const user = this.currentUserValue;
        if (user && this.isTokenExpired(user.tokenExpiration)) {
          this.logoutDueToExpiration();
        }
      });
  }

  private stopTokenExpirationCheck(): void {
    if (this.tokenCheckTimer) {
      this.tokenCheckTimer.unsubscribe();
      this.tokenCheckTimer = null;
    }
  }
  private handleAuthentication(response: AuthResponse): void {
    const user: User = {
      id: response.userId,
      userName: response.userName,
      email: '',
      token: response.token,
      tokenExpiration: response.expiration,
      roles: response.roles
    };
    
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
      // Démarrer la vérification du token après connexion (désactivé temporairement)
     this.startTokenExpirationCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTokenExpirationCheck();
  }
}
