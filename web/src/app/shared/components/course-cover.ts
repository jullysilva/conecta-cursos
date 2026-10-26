import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initials } from '../utils/format';

const COVER_TONES = ['#1f6f5c', '#2d5d7b', '#6b4e8a', '#8a5a12', '#7a3b3b', '#3e6b2f'];

/** Course image, or a generated typographic cover when no image exists. */
@Component({
  selector: 'cp-course-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imageUrl()) {
      <img [src]="imageUrl()" [alt]="''" loading="lazy" />
    } @else {
      <!-- The monogram is drawn with CSS content: it is decoration, not text. -->
      <div class="generated" [style.background]="tone()" [attr.data-monogram]="monogram()" aria-hidden="true"></div>
    }
  `,
  styles: `
    :host { display: block; aspect-ratio: 16 / 9; overflow: hidden; background: var(--line); }
    img { width: 100%; height: 100%; object-fit: cover; }
    .generated { height: 100%; display: flex; align-items: flex-end; overflow: hidden; color: rgb(255 255 255 / 22%);
      background-image: radial-gradient(circle at 88% 12%, rgb(255 255 255 / 14%) 0 18%, transparent 19%); }
    .generated::after { content: attr(data-monogram); margin: 0 0 -0.18em -0.04em; font: 800 clamp(4rem, 9vw, 9rem)/0.8 var(--font-display);
      letter-spacing: -0.06em; }
  `,
})
export class CourseCover {
  readonly title = input.required<string>();
  readonly imageUrl = input<string | null>(null);

  protected readonly monogram = computed(() => initials(this.title()));

  protected readonly tone = computed(() => {
    let hash = 0;
    for (const char of this.title()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return COVER_TONES[hash % COVER_TONES.length];
  });
}
