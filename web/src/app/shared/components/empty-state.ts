import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'cp-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <i [class]="icon()" aria-hidden="true"></i>
    <h3>{{ title() }}</h3>
    @if (text()) {
      <p>{{ text() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: 0.5rem; padding: 3rem 1.5rem; text-align: center;
      border: 1px dashed var(--line); border-radius: var(--radius-md); background: var(--surface); }
    i { font-size: 2rem; color: var(--forest); }
    p { max-width: 44ch; color: var(--ink-soft); }
  `,
})
export class EmptyState {
  readonly icon = input('ri-inbox-line');
  readonly title = input.required<string>();
  readonly text = input('');
}
