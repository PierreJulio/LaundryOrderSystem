import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TokenExpirationWarningService } from '../../../services/token-expiration-warning.service';
import { AuthService } from '../../../services/auth.service';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    MessageModule
  ],
  template: `
    <p-dialog 
      [(visible)]="showWarning" 
      [modal]="true" 
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      styleClass="session-warning-dialog"
      header="⚠️ Session expirée bientôt">
      
      <div class="warning-content">
        <p-message 
          severity="warn" 
          [text]="warningMessage"
          [closable]="false">
        </p-message>
        
        <div class="countdown" *ngIf="remainingSeconds !== null">
          <p>Temps restant: <strong>{{ formatTime(remainingSeconds) }}</strong></p>
        </div>
        
        <div class="warning-actions">
          <button 
            pButton 
            label="Prolonger la session" 
            icon="pi pi-refresh"
            class="p-button-success"
            (click)="extendSession()">
          </button>
          
          <button 
            pButton 
            label="Se déconnecter" 
            icon="pi pi-sign-out"
            class="p-button-secondary"
            (click)="logout()">
          </button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .session-warning-dialog {
      min-width: 400px;
    }
    
    .warning-content {
      text-align: center;
      padding: 1rem 0;
    }
    
    .countdown {
      margin: 1rem 0;
      font-size: 1.1em;
    }
    
    .countdown strong {
      color: #e74c3c;
      font-size: 1.2em;
    }
    
    .warning-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
    
    .warning-actions button {
      min-width: 150px;
    }
  `]
})
export class SessionWarningComponent implements OnInit, OnDestroy {
  showWarning = false;
  remainingSeconds: number | null = null;
  warningMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private tokenWarningService: TokenExpirationWarningService,
    private authService: AuthService
  ) {}
  ngOnInit(): void {
    this.tokenWarningService.warning$
      .pipe(takeUntil(this.destroy$))
      .subscribe((seconds: number | null) => {
        if (seconds !== null && seconds > 0) {
          this.remainingSeconds = seconds;
          this.showWarning = true;
          this.warningMessage = 'Votre session va expirer bientôt. Souhaitez-vous la prolonger ?';
        } else {
          this.showWarning = false;
          this.remainingSeconds = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  extendSession(): void {
    // Pour l'instant, on cache l'avertissement
    // Dans une vraie application, on ferait un appel pour renouveler le token
    this.tokenWarningService.extendSession();
    this.showWarning = false;
  }

  logout(): void {
    this.authService.logout();
    this.showWarning = false;
  }
}
