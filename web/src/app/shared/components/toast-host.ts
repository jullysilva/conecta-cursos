import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'cp-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class.is-error]="toast.kind === 'error'" role="status">
          <i [class]="toast.kind === 'error' ? 'ri-error-warning-line' : 'ri-check-line'" aria-hidden="true"></i>
          <span>{{ toast.message }}</span>
          <button type="button" class="btn btn-ghost btn-icon" (click)="toasts.dismiss(toast.id)" aria-label="Fechar aviso">
            <i class="ri-close-line" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; right: 1.5rem; bottom: 1.5rem; z-index: 50; display: grid; gap: 0.5rem; }
    .toast { display: flex; align-items: center; gap: 0.625rem; min-width: 280px; max-width: 420px;
      padding: 0.5rem 0.5rem 0.5rem 1rem; border-left: 4px solid var(--forest); border-radius: var(--radius-sm);
      background: var(--ink); color: #fff; box-shadow: 0 12px 32px rgb(28 43 57 / 25%); }
    .toast.is-error { border-left-color: var(--danger); }
    .toast span { flex: 1; }
    .toast .btn-ghost { color: #fff; }
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
