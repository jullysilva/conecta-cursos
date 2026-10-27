import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo symbol plus the brand name as live text, so it follows the surrounding theme colour
 * (the image lockup has dark green lettering that only works on light backgrounds).
 * Decorative by default: the wrapping link provides the accessible name.
 */
@Component({
  selector: 'cp-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img src="brand/symbol-96.png" alt="" [width]="size()" [height]="size()" decoding="async">
    @if (showName()) {
      <span class="name" aria-hidden="true"><strong>Conecta</strong> Cursos</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.625rem; color: inherit; }
    img { display: block; flex: none; }
    .name { display: var(--brand-name-display, inline); font: 500 1.0625rem/1 'Montserrat', system-ui, sans-serif; letter-spacing: 0.01em; white-space: nowrap; }
    strong { font-weight: 800; }
  `,
})
export class BrandMark {
  readonly size = input(40);
  readonly showName = input(true);
}
