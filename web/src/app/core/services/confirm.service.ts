import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<ConfirmRequest | null>(null);

  ask(options: { title: string; message: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) =>
      this.pending.set({
        confirmLabel: 'Confirmar',
        danger: false,
        ...options,
        resolve,
      }),
    );
  }

  answer(value: boolean): void {
    this.pending()?.resolve(value);
    this.pending.set(null);
  }
}
