import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** The amber progress rail: the platform's signature element. */
@Component({
  selector: 'cp-progress-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rail"
      [class.is-large]="size() === 'lg'"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="value()"
      [attr.aria-label]="label()"
    >
      <span class="fill" [style.width.%]="value()"></span>
    </div>
    @if (showValue()) {
      <span class="value">{{ value() }}%</span>
    }
  `,
  styles: `
    :host { display: flex; align-items: center; gap: 0.625rem; }
    .rail { flex: 1; height: 6px; border-radius: 999px; background: var(--rail-track, var(--amber-tint)); overflow: hidden; }
    .rail.is-large { height: 12px; }
    .fill { display: block; height: 100%; border-radius: inherit; background: var(--amber); transition: width 400ms ease; }
    .value { min-width: 2.75rem; font: 700 0.875rem/1 var(--font-display); text-align: right; }
  `,
})
export class ProgressRail {
  readonly percent = input(0);
  readonly size = input<'sm' | 'lg'>('sm');
  readonly label = input('Progresso');
  readonly showValue = input(true);
  protected readonly value = computed(() => Math.min(100, Math.max(0, Math.round(this.percent()))));
}
