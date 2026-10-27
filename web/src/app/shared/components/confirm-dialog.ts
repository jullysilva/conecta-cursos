import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'cp-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" aria-labelledby="confirm-title" (cancel)="confirm.answer(false)">
      @if (confirm.pending(); as request) {
        <div class="content">
          <h2 id="confirm-title">{{ request.title }}</h2>
          <p>{{ request.message }}</p>
          <div class="actions">
            <button type="button" class="btn btn-secondary" (click)="confirm.answer(false)">Cancelar</button>
            <button type="button" class="btn" [class.btn-danger]="request.danger" [class.btn-primary]="!request.danger"
              (click)="confirm.answer(true)">{{ request.confirmLabel }}</button>
          </div>
        </div>
      }
    </dialog>
  `,
  styles: `
    .content { display: grid; gap: 1rem; padding: 1.5rem; }
    h2 { font-size: 1.25rem; }
    p { color: var(--ink-soft); }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.confirm.pending() && !element.open) element.showModal();
      if (!this.confirm.pending() && element.open) element.close();
    });
  }
}
