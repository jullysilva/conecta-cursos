import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import type { Role } from '../../../core/models/models';
import type { UserPayload } from '../../../core/models/admin.models';
import { errorMessage } from '../../../shared/utils/http-error';
import { valueOf } from '../../../shared/utils/resource';

const NEW_ID = 'novo';

@Component({
  selector: 'cp-user-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-edit.html',
  styles: `
    .narrow { max-width: 860px; }
    .back { display: inline-flex; gap: 0.375rem; font-weight: 600; text-decoration: none; }
    .form { display: grid; gap: 1.25rem; padding: 1.5rem; }
    .actions { display: flex; justify-content: space-between; }
    .enrollments { display: grid; gap: 0.75rem; padding: 1.25rem 1.5rem; }
    .enrollments ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
    .enrollments li { display: flex; justify-content: space-between; }
  `,
})
export class UserEdit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();
  protected readonly isNew = computed(() => this.id() === NEW_ID);
  protected readonly isSelf = computed(() => this.auth.user()?.id === this.id());
  protected readonly saving = signal(false);
  protected readonly dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

  protected readonly user = rxResource({
    params: () => (this.isNew() ? undefined : this.id()),
    stream: ({ params }) => this.api.user(params),
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['STUDENT' as Role],
    active: [true],
    password: ['', [Validators.minLength(8), Validators.maxLength(72)]],
  });

  constructor() {
    effect(() => {
      if (this.isNew()) this.form.controls.password.addValidators(Validators.required);
      const user = valueOf(this.user);
      if (user) this.form.reset({ ...user, password: '' });
      // Admins cannot demote or deactivate themselves (also enforced by the API).
      for (const control of [this.form.controls.role, this.form.controls.active]) {
        if (this.isSelf()) control.disable();
        else control.enable();
      }
    });
  }

  protected toDate(value: string): Date {
    return new Date(value);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, ...value } = this.form.getRawValue();
    const payload: UserPayload = { ...value, name: value.name.trim(), ...(password && { password }) };
    this.saving.set(true);
    const request = this.isNew() ? this.api.createUser(payload) : this.api.updateUser(this.id(), payload);
    request.subscribe({
      next: () => {
        this.toast.success(this.isNew() ? 'Usuário criado.' : 'Usuário salvo.');
        void this.router.navigate(['/adm/usuarios']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }

  protected async remove(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir usuário?',
      message: 'O usuário perde o acesso e todo o histórico de progresso é apagado. Para só bloquear o acesso, desmarque "Ativo".',
      confirmLabel: 'Excluir usuário',
      danger: true,
    });
    if (!confirmed) return;
    this.api.deleteUser(this.id()).subscribe({
      next: () => {
        this.toast.success('Usuário excluído.');
        void this.router.navigate(['/adm/usuarios']);
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
