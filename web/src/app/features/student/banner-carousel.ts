import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Banner } from '../../core/models/models';

@Component({
  selector: 'cp-banner-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (current(); as banner) {
      <section class="carousel" aria-roledescription="carrossel" aria-label="Destaques">
        <div class="slide" [style.background-image]="'url(' + banner.imageUrl + ')'"
          aria-roledescription="slide" [attr.aria-label]="(index() + 1) + ' de ' + banners().length">
          <div class="copy">
            <h2>{{ banner.title }}</h2>
            @if (banner.subtitle) {
              <p>{{ banner.subtitle }}</p>
            }
            @if (banner.linkUrl) {
              @if (isInternal(banner.linkUrl)) {
                <a class="btn btn-secondary" [routerLink]="banner.linkUrl">Ver agora</a>
              } @else {
                <a class="btn btn-secondary" [href]="banner.linkUrl" target="_blank" rel="noopener">Ver agora</a>
              }
            }
          </div>
        </div>
        @if (banners().length > 1) {
          <div class="controls">
            @for (item of banners(); track item.id; let i = $index) {
              <button type="button" class="dot" [class.is-active]="i === index()" (click)="index.set(i)"
                [attr.aria-label]="'Mostrar destaque ' + (i + 1)" [attr.aria-current]="i === index()"></button>
            }
          </div>
        }
      </section>
    }
  `,
  styles: `
    .carousel { position: relative; }
    .slide { min-height: 220px; display: flex; align-items: flex-end; border-radius: var(--radius-lg);
      background: var(--ink) center / cover no-repeat; overflow: hidden; }
    .copy { width: 100%; display: grid; gap: 0.5rem; justify-items: start; padding: 2rem;
      background: linear-gradient(to top, rgb(28 43 57 / 88%), rgb(28 43 57 / 0%)); color: #fff; }
    .copy p { max-width: 60ch; color: #dfe7ec; }
    .controls { position: absolute; right: 1.5rem; bottom: 1.5rem; display: flex; gap: 0.375rem; }
    .dot { width: 10px; height: 10px; padding: 0; border: 0; border-radius: 999px; background: rgb(255 255 255 / 45%); cursor: pointer; }
    .dot.is-active { width: 28px; background: var(--amber); }
  `,
})
export class BannerCarousel {
  readonly banners = input.required<Banner[]>();
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.banners()[this.index()] ?? null);

  protected isInternal(url: string): boolean {
    return url.startsWith('/');
  }
}
