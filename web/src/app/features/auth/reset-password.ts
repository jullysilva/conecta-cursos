import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../shared/utils/http-error';
import { AuthFrame } from './auth-frame';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirmation')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'cp-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthFrame],
  template: `
    <cp-auth-frame heading="Criar nova senha" lead="Use pelo menos 8 caracteres.">
      @if (!token) {
        <p class="alert" role="alert">Este link é inválido. Peça um novo na tela de recuperação.</p>
        <a routerLink="/recuperar-senha" class="btn btn-secondary">Pedir novo link</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
          @if (error()) {
            <p class="alert" role="alert">{{ error() }}</p>
          }
          <div class="field">
            <label for="password">Nova senha</label>
            <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="error">A senha precisa ter de 8 a 72 caracteres.</span>
            }
          </div>
          <div class="field">
            <label for="confirmation">Repita a nova senha</label>
            <input id="confirmation" class="input" type="password" formControlName="confirmation" autocomplete="new-password" />
            @if (form.controls.confirmation.touched && form.hasError('mismatch')) {
              <span class="error">As senhas não coincidem.</span>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">Salvar nova senha</button>
        </form>
      }
    </cp-auth-frame>
  `,
  styles: `
    .stack { display: grid; gap: 1.125rem; }
    .alert { padding: 0.75rem 1rem; border-radius: var(--radius-sm); background: var(--danger-tint); color: var(--danger); }
  `,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.toast.success('Senha alterada. Entre com a nova senha.');
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
