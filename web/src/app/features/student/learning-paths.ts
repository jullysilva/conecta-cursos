import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';

/** Learning paths as Mova-style 16:9 cards with a gradient overlay. */
@Component({
  selector: 'cp-learning-paths',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1 class="mova-section-title">Trilhas</h1>
    <p class="lead">Sequências de cursos pensadas para desenvolver uma competência do início ao fim.</p>
    @if (paths.isLoading()) {
      <p class="lead" role="status">Carregando trilhas…</p>
    } @else {
      <ul class="grid">
        @for (path of (paths.hasValue() ? paths.value() : undefined); track path.id) {
          <li>
            <a class="card" [routerLink]="['/trilhas', path.id]">
              <span class="thumb" aria-hidden="true">
                @if (path.thumbnailUrl) {
                  <img [src]="path.thumbnailUrl" alt="" loading="lazy" />
                } @else {
                  <i class="ri-route-line"></i>
                }
              </span>
              <span class="overlay">
                <span class="title">{{ path.title }}</span>
                <span class="meta">{{ path.coursesCount }} {{ path.coursesCount === 1 ? 'curso' : 'cursos' }}</span>
              </span>
            </a>
          </li>
        } @empty {
          <li class="empty">Nenhuma trilha disponível. Quando uma trilha for publicada, ela aparece aqui.</li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .lead { margin: 0 0 1.5rem; color: var(--mova-white-hover); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin: 0; padding: 0; list-style: none; }
    .card { position: relative; display: block; aspect-ratio: 16 / 9; overflow: hidden; border: 1px solid #3d3d3d;
      border-radius: 12px; background: var(--mova-min); color: inherit; text-decoration: none;
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease; }
    .card:hover { transform: translateY(-2px); border-color: var(--mova-accent); box-shadow: 0 8px 24px rgb(0 0 0 / 40%); }
    .thumb { position: absolute; inset: 0; display: grid; place-items: center; color: rgb(251 251 251 / 28%); font-size: 2.5rem;
      background: radial-gradient(118% 150% at 10% 118%, color-mix(in srgb, var(--mova-accent) 30%, transparent) 0%, transparent 62%), var(--mova-bg); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 0.25rem; padding: 1rem 1.125rem;
      background: linear-gradient(180deg, transparent, rgb(0 0 0 / 55%) 60%, rgb(0 0 0 / 85%)); }
    .title { font-size: 1.15rem; font-weight: 700; line-height: 1.25; }
    .meta { color: var(--mova-white-hover); font-size: 0.85rem; }
    .empty { color: var(--mova-white-hover); }
  `,
})
export class LearningPaths {
  private readonly learning = inject(LearningService);
  protected readonly paths = rxResource({ stream: () => this.learning.learningPaths() });
}
