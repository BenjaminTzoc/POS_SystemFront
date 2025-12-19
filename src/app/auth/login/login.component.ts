import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, FloatLabelModule, InputTextModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
      this.errorMessage.set('¡Bienvenido de nuevo! Te redirigimos al dashboard.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: this.errorMessage() || 'Error',
      });
    }
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Email o contraseña inválidos. Por favor, intenta nuevamente.');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.errorMessage() || 'Error',
      });
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.loginForm.value as { email: string; password: string };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log(response);
        this.isLoading.set(false);
        if (response.statusCode === 200) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `¡Bienvenido de nuevo ${response.data.user.name}!`,
          });
        } else {
          this.errorMessage.set(response.message);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage() || 'Error',
          });
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Error al iniciar sesión. Valide sus credenciales'
        );
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage() || 'Error',
        });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }
}
