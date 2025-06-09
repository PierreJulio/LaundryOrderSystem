import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenExpirationWarningService implements OnDestroy {
  private warningSubject = new BehaviorSubject<number | null>(null);
  public warning$ = this.warningSubject.asObservable();
  private destroy$ = new Subject<void>();
  private warningTimer: any;

  constructor(private authService: AuthService) {
    // Écouter les changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user && user.tokenExpiration) {
          this.startWarningTimer(user.tokenExpiration);
        } else {
          this.stopWarningTimer();
        }
      });
  }

  private startWarningTimer(tokenExpiration: string): void {
    this.stopWarningTimer();
    
    const expirationDate = new Date(tokenExpiration);
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();
    
    // Afficher l'avertissement 5 minutes avant l'expiration
    const warningTime = timeUntilExpiration - (5 * 60 * 1000); // 5 minutes
    
    if (warningTime > 0) {
      this.warningTimer = timer(warningTime).subscribe(() => {
        const remainingTime = Math.max(0, Math.floor((expirationDate.getTime() - new Date().getTime()) / 1000));
        this.warningSubject.next(remainingTime);
        
        // Démarrer un compte à rebours
        this.startCountdown(remainingTime);
      });
    } else if (timeUntilExpiration > 0) {
      // Si on est déjà dans les 5 dernières minutes
      const remainingTime = Math.floor(timeUntilExpiration / 1000);
      this.warningSubject.next(remainingTime);
      this.startCountdown(remainingTime);
    }
  }

  private startCountdown(initialSeconds: number): void {
    let remainingSeconds = initialSeconds;
    
    const countdownTimer = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (remainingSeconds <= 0) {
          this.warningSubject.next(null);
          countdownTimer.unsubscribe();
          return;
        }
        
        this.warningSubject.next(remainingSeconds);
        remainingSeconds--;
      });
  }

  private stopWarningTimer(): void {
    if (this.warningTimer) {
      this.warningTimer.unsubscribe();
      this.warningTimer = null;
    }
    this.warningSubject.next(null);
  }

  extendSession(): void {
    // Cette méthode pourrait déclencher un renouvellement de token
    // Pour l'instant, on cache juste l'avertissement
    this.warningSubject.next(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopWarningTimer();
  }
}
