import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { CourseCover } from '../../shared/components/course-cover';
import { EmptyState } from '../../shared/components/empty-state';

@Component({
  selector: 'cp-learning-paths',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCover, EmptyState],
  template: `
    <header>
      <h1>Trilhas</h1>
      <p>Sequências de cursos pensadas para desenvolver uma competência do início ao fim.</p>
    </header>
    @if (paths.isLoading()) {
      <p class="muted" role="status">Carregando trilhas…</p>
    } @else {
      <div class="grid">
        @for (path of paths.value(); track path.id) {
          <a class="path" [routerLink]="['/trilhas', path.id]">
            <cp-course-cover [title]="path.title" [imageUrl]="path.thumbnailUrl" />
            <div class="body">
              <h2>{{ path.title }}</h2>
              <p>{{ path.description }}</p>
              <span class="count">{{ path.coursesCount }} {{ path.coursesCount === 1 ? 'curso' : 'cursos' }}</span>
            </div>
          </a>
        } @empty {
          <cp-empty-state icon="ri-route-line" title="Nenhuma trilha disponível"
            text="Quando uma trilha for publicada, ela aparece aqui." />
        }
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: 2rem; max-width: 1280px; }
    header { display: grid; gap: 0.5rem; }
    header p, .muted { color: var(--ink-soft); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
    .path { display: grid; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-md);
      background: var(--surface); color: inherit; text-decoration: none; }
    .path:hover h2 { color: var(--forest); }
    .body { display: grid; gap: 0.5rem; padding: 1rem 1.125rem 1.25rem; }
    h2 { font-size: 1.25rem; }
    .body p { color: var(--ink-soft); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .count { color: var(--forest); font-weight: 700; }
  `,
})
export class LearningPaths {
  private readonly learning = inject(LearningService);
  protected readonly paths = rxResource({ stream: () => this.learning.learningPaths() });
}
