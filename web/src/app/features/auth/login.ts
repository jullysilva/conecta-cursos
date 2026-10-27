import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../shared/utils/http-error';
import { AuthFrame } from './auth-frame';

@Component({
  selector: 'cp-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthFrame],
  template: `
    <cp-auth-frame heading="Entrar" lead="Use o e-mail e a senha cadastrados pela sua empresa.">
      <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
        @if (error()) {
          <p class="alert" role="alert">{{ error() }}</p>
        }
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="error">Informe um e-mail válido.</span>
          }
        </div>
        <div class="field">
          <label for="password">Senha</label>
          <div class="password">
            <input id="password" class="input" [type]="showPassword() ? 'text' : 'password'"
              formControlName="password" autocomplete="current-password" />
            <button type="button" class="btn btn-ghost btn-icon" (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Mostrar senha'" [attr.aria-pressed]="showPassword()">
              <i [class]="showPassword() ? 'ri-eye-off-line' : 'ri-eye-line'" aria-hidden="true"></i>
            </button>
          </div>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="error">Informe sua senha.</span>
          }
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>
        <a routerLink="/recuperar-senha" class="forgot">Esqueci minha senha</a>
      </form>
    </cp-auth-frame>
  `,
  styles: `
    .stack { display: grid; gap: 1.125rem; }
    .password { position: relative; }
    .password .btn { position: absolute; right: 0.25rem; top: 0.1875rem; }
    .password .input { padding-right: 2.75rem; }
    .forgot { justify-self: start; font-weight: 600; }
    .alert { padding: 0.75rem 1rem; border-radius: var(--radius-sm); background: var(--danger-tint); color: var(--danger); }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (user) => {
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        const fallback = user.role === 'ADMIN' ? '/adm' : '/home';
        void this.router.navigateByUrl(redirect?.startsWith('/') ? redirect : fallback);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error, 'E-mail ou senha incorretos.'));
      },
    });
  }
}
