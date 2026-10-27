import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Split-screen frame shared by login and password recovery screens. */
@Component({
  selector: 'cp-auth-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="statement" aria-hidden="true">
      <img class="lockup" src="brand/logo-conecta-cursos.png" alt="" width="200" height="210" decoding="async">
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
    .statement { display: flex; flex-direction: column; justify-content: space-between; gap: 2rem; padding: 3rem;
      background: var(--forest-tint); color: var(--forest-strong); }
    .lockup { width: 200px; height: auto; }
    .quote { max-width: 14ch; font: 800 clamp(2.5rem, 4.4vw, 4rem)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .rail { height: 14px; border-radius: 999px; background: rgb(12 108 60 / 14%); overflow: hidden; }
    .rail span { display: block; width: 62%; height: 100%; border-radius: inherit;
      background: linear-gradient(90deg, var(--forest), var(--brand-lime)); }
    .form-side { display: grid; place-items: center; padding: 3rem 2rem; }
    .form-box { width: min(400px, 100%); display: grid; gap: 1.5rem; }
    .lead { margin-top: -0.75rem; color: var(--ink-soft); }
  `,
})
export class AuthFrame {
  readonly heading = input.required<string>();
  readonly lead = input('');
}
