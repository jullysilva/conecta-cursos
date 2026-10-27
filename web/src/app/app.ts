import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast-host';
import { ConfirmDialog } from './shared/components/confirm-dialog';

@Component({
  selector: 'cp-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastHost, ConfirmDialog],
  template: `
    <router-outlet />
    <cp-toast-host />
    <cp-confirm-dialog />
  `,
})
export class App {}
