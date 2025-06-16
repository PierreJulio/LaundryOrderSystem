import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/user';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/orders']);
    }    
    this.registerForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      phoneNumber: new FormControl('', [Validators.required]),
      acceptTerms: new FormControl(false, [Validators.requiredTrue])
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  }
  passwordMatchValidator(g: AbstractControl) {
    if (!g.get('password') || !g.get('confirmPassword')) return null;
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  toggleAcceptTerms(): void {
    const currentValue = this.registerForm.get('acceptTerms')?.value;
    this.registerForm.get('acceptTerms')?.setValue(!currentValue);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to trigger validation display
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
      const registerRequest: RegisterRequest = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      confirmPassword: this.registerForm.value.confirmPassword,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      phoneNumber: this.registerForm.value.phoneNumber || undefined
    };

    this.authService.register(registerRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Inscription réussie',
          detail: 'Votre compte a été créé avec succès. Vous êtes maintenant connecté.'
        });
        setTimeout(() => {
          this.router.navigate(['/orders']);
        }, 1500);
      },
      error: error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur d\'inscription',
          detail: error.error?.message || 'Une erreur est survenue lors de l\'inscription'
        });
        this.loading = false;
      }
    });
  }
}
