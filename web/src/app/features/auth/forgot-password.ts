import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../shared/utils/http-error';
import { AuthFrame } from './auth-frame';

@Component({
  selector: 'cp-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthFrame],
  template: `
    <cp-auth-frame heading="Recuperar senha" lead="Enviaremos um link para você criar uma nova senha.">
      @if (sent()) {
        <p class="notice" role="status">
          Se houver uma conta com esse e-mail, o link chegará em alguns minutos. Confira também a caixa de spam.
        </p>
        <a routerLink="/login" class="btn btn-secondary">Voltar para o login</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
          @if (error()) {
            <p class="alert" role="alert">{{ error() }}</p>
          }
          <div class="field">
            <label for="email">E-mail</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="error">Informe um e-mail válido.</span>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Enviar link</button>
          <a routerLink="/login">Voltar para o login</a>
        </form>
      }
    </cp-auth-frame>
  `,
  styles: `
    .stack { display: grid; gap: 1.125rem; }
    .notice { padding: 1rem; border-radius: var(--radius-sm); background: var(--forest-tint); color: var(--forest-strong); }
    .alert { padding: 0.75rem 1rem; border-radius: var(--radius-sm); background: var(--danger-tint); color: var(--danger); }
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => this.sent.set(true),
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
