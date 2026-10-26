import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { CourseCover } from '../../shared/components/course-cover';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressRail } from '../../shared/components/progress-rail';

@Component({
  selector: 'cp-learning-path-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCover, EmptyState, ProgressRail],
  template: `
    @if (path.error()) {
      <cp-empty-state icon="ri-error-warning-line" title="Trilha não encontrada">
        <a routerLink="/trilhas" class="btn btn-secondary">Ver todas as trilhas</a>
      </cp-empty-state>
    } @else if (path.value(); as path) {
      <a routerLink="/trilhas" class="back"><i class="ri-arrow-left-line" aria-hidden="true"></i> Trilhas</a>
      <header>
        <h1>{{ path.title }}</h1>
        @if (path.description) {
          <p>{{ path.description }}</p>
        }
        <cp-progress-rail size="lg" [percent]="overall()" label="Progresso na trilha" />
      </header>
      <ol class="steps">
        @for (course of path.courses; track course.id; let i = $index) {
          <li [class.is-done]="course.progress?.percent === 100">
            <span class="step" aria-hidden="true">{{ i + 1 }}</span>
            <a class="course" [routerLink]="['/curso', course.id]">
              <cp-course-cover [title]="course.title" [imageUrl]="course.thumbnailUrl" />
              <div class="body">
                <h2>{{ course.title }}</h2>
                <p>{{ course.description }}</p>
                <cp-progress-rail [percent]="course.progress?.percent ?? 0" [label]="'Progresso em ' + course.title" />
              </div>
            </a>
          </li>
        } @empty {
          <cp-empty-state icon="ri-route-line" title="Esta trilha ainda não tem cursos publicados" />
        }
      </ol>
    } @else {
      <p class="muted" role="status">Carregando trilha…</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 1.5rem; max-width: 960px; }
    .back { display: inline-flex; gap: 0.375rem; font-weight: 600; text-decoration: none; }
    header { display: grid; gap: 0.75rem; }
    header p, .muted { max-width: 64ch; color: var(--ink-soft); }
    .steps { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; position: relative; }
    li { display: grid; grid-template-columns: 2.5rem 1fr; gap: 1rem; align-items: center; }
    .step { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%;
      border: 2px solid var(--line); background: var(--surface); font: 800 1rem var(--font-display); }
    li.is-done .step { border-color: var(--forest); background: var(--forest); color: #fff; }
    .course { display: grid; grid-template-columns: 200px 1fr; overflow: hidden; border: 1px solid var(--line);
      border-radius: var(--radius-md); background: var(--surface); color: inherit; text-decoration: none; }
    .course:hover h2 { color: var(--forest); }
    .body { display: grid; gap: 0.5rem; align-content: center; padding: 1rem 1.25rem; }
    h2 { font-size: 1.125rem; }
    .body p { color: var(--ink-soft); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `,
})
export class LearningPathPage {
  private readonly learning = inject(LearningService);
  readonly idPath = input.required<string>();

  protected readonly path = rxResource({
    params: () => this.idPath(),
    stream: ({ params }) => this.learning.learningPath(params),
  });

  protected readonly overall = computed(() => {
    const courses = this.path.value()?.courses ?? [];
    const total = courses.reduce((sum, course) => sum + (course.progress?.totalLessons ?? 0), 0);
    const done = courses.reduce((sum, course) => sum + (course.progress?.completedLessons ?? 0), 0);
    return total ? (done / total) * 100 : 0;
  });
}
