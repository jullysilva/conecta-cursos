import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Banner } from '../../../core/models/models';

const AUTOPLAY_MS = 5000;

/** Full-width image carousel with autoplay (paused on hover/focus and for reduced motion). */
@Component({
  selector: 'cp-mova-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="banner" aria-roledescription="carrossel" aria-label="Destaques"
      (mouseenter)="paused.set(true)" (mouseleave)="paused.set(false)"
      (focusin)="paused.set(true)" (focusout)="paused.set(false)">
      <div class="viewport">
        <div class="track" id="banner-slides" aria-live="polite" [style.transform]="'translateX(' + -index() * 100 + '%)'">
          @for (banner of slides(); track banner.id; let i = $index) {
            <div class="slide" role="group" aria-roledescription="slide" [attr.aria-label]="(i + 1) + ' de ' + slides().length"
              [attr.aria-hidden]="i !== index()" [attr.inert]="i !== index() ? '' : null">
              @if (banner.linkUrl && isInternal(banner.linkUrl)) {
                <a class="link" [routerLink]="banner.linkUrl"><img [src]="banner.imageUrl" [alt]="banner.title" /></a>
              } @else if (banner.linkUrl) {
                <a class="link" [href]="banner.linkUrl" target="_blank" rel="noopener"><img [src]="banner.imageUrl" [alt]="banner.title" /></a>
              } @else {
                <img [src]="banner.imageUrl" [alt]="banner.title" />
              }
            </div>
          }
        </div>
      </div>
      @if (slides().length > 1) {
        <button type="button" class="arrow arrow--prev" aria-controls="banner-slides" aria-label="Banner anterior" (click)="go(index() - 1)">
          <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
        </button>
        <button type="button" class="arrow arrow--next" aria-controls="banner-slides" aria-label="Próximo banner" (click)="go(index() + 1)">
          <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </button>
        <div class="bullets" role="group" aria-label="Selecionar banner">
          @for (banner of slides(); track banner.id; let i = $index) {
            <button type="button" class="bullet" [class.is-active]="i === index()" aria-controls="banner-slides"
              [attr.aria-current]="i === index() ? 'true' : null" [attr.aria-label]="'Ir para banner ' + (i + 1)" (click)="go(i)"></button>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './mova-banner.scss',
})
export class MovaBanner {
  readonly slides = input.required<Banner[]>();
  protected readonly index = signal(0);
  protected readonly paused = signal(false);
  private readonly count = computed(() => this.slides().length);

  constructor() {
    const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const timer = setInterval(() => {
      if (!this.paused() && this.count() > 1) this.go(this.index() + 1);
    }, AUTOPLAY_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected go(target: number): void {
    this.index.set((target + this.count()) % this.count());
  }

  protected isInternal(url: string): boolean {
    return url.startsWith('/');
  }
}
