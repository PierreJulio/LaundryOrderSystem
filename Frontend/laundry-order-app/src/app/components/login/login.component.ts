import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user';

@Component({
  selector: 'app-login',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    CheckboxModule,
    DividerModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  returnUrl: string;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/orders']);
    }
    
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required])
    });
    
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/orders';
  }
  ngOnInit(): void {
    // Vérifier s'il y a un message d'expiration de session
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Session expirée',
        detail: message,
        life: 5000
      });
    }
  }
  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    
    const loginRequest: LoginRequest = {
      email: this.loginForm.controls['username'].value,
      password: this.loginForm.controls['password'].value
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Identifiant ou mot de passe incorrect'
        });
        this.loading = false;
      }
    });
  }
}
