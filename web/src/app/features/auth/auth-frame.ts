import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Split-screen frame shared by login and password recovery screens. */
@Component({
  selector: 'cp-auth-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="statement" aria-hidden="true">
      <span class="brand"><span class="mark">C</span> Campus</span>
      <p class="quote">Aprender um pouco todo dia muda o ano inteiro.</p>
      <div class="rail"><span></span></div>
    </section>
    <main class="form-side">
      <div class="form-box">
        <h1>{{ heading() }}</h1>
        @if (lead()) {
          <p class="lead">{{ lead() }}</p>
        }
        <ng-content />
      </div>
    </main>
  `,
  styles: `
    :host { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); min-height: 100vh; }
    .statement { display: flex; flex-direction: column; justify-content: space-between; padding: 3rem;
      background: var(--ink); color: #fff; }
    .brand { display: flex; align-items: center; gap: 0.625rem; font: 800 1.5rem/1 var(--font-display); }
    .mark { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 10px 10px 10px 2px;
      background: var(--amber); color: var(--ink); }
    .quote { max-width: 14ch; font: 800 clamp(2.5rem, 4.4vw, 4rem)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .rail { height: 14px; border-radius: 999px; background: rgb(255 255 255 / 12%); overflow: hidden; }
    .rail span { display: block; width: 62%; height: 100%; border-radius: inherit; background: var(--amber); }
    .form-side { display: grid; place-items: center; padding: 3rem 2rem; }
    .form-box { width: min(400px, 100%); display: grid; gap: 1.5rem; }
    .lead { margin-top: -0.75rem; color: var(--ink-soft); }
  `,
})
export class AuthFrame {
  readonly heading = input.required<string>();
  readonly lead = input('');
}
