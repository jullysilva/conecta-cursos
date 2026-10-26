import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LearningService } from '../../core/services/learning.service';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressRail } from '../../shared/components/progress-rail';

@Component({
  selector: 'cp-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ProgressRail],
  template: `
    <header>
      <h1>Meu progresso</h1>
      @if (auth.user(); as user) {
        <p>{{ user.name }}, {{ user.email }}</p>
      }
    </header>

    @if (summary.value(); as summary) {
      <dl class="stats">
        <div><dt>Aulas concluídas</dt><dd>{{ summary.completedLessons }}</dd></div>
        <div><dt>Cursos em andamento</dt><dd>{{ summary.inProgressCourses }}</dd></div>
        <div><dt>Cursos concluídos</dt><dd>{{ summary.completedCourses }}</dd></div>
      </dl>

      <section aria-labelledby="my-courses">
        <h2 id="my-courses">Meus cursos</h2>
        @if (summary.courses.length) {
          <table class="table panel">
            <thead>
              <tr><th scope="col">Curso</th><th scope="col">Progresso</th><th scope="col">Último acesso</th><th scope="col"><span class="sr-only">Ações</span></th></tr>
            </thead>
            <tbody>
              @for (course of summary.courses; track course.id) {
                <tr>
                  <td><a [routerLink]="['/curso', course.id]">{{ course.title }}</a></td>
                  <td class="progress"><cp-progress-rail [percent]="course.progress.percent" [label]="'Progresso em ' + course.title" /></td>
                  <td>{{ dateFormat.format(toDate(course.lastAccessedAt)) }}</td>
                  <td class="actions">
                    @if (course.progress.percent === 100) {
                      <span class="badge is-positive">Concluído</span>
                    } @else if (course.lastLessonId) {
                      <a class="btn btn-secondary" [routerLink]="['/aula', course.lastLessonId]">Continuar</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <cp-empty-state icon="ri-book-open-line" title="Você ainda não começou nenhum curso"
            text="Escolha um curso na página inicial para começar.">
            <a routerLink="/home" class="btn btn-primary">Explorar cursos</a>
          </cp-empty-state>
        }
      </section>
    } @else {
      <p class="muted" role="status">Carregando…</p>
    }
  `,
  styles: `
    :host { display: grid; gap: 2rem; max-width: 1040px; }
    header { display: grid; gap: 0.375rem; }
    header p, .muted { color: var(--ink-soft); }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 0; }
    .stats div { padding: 1.25rem; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); }
    dt { color: var(--ink-soft); font-weight: 600; }
    dd { margin: 0.25rem 0 0; font: 800 2.25rem/1 var(--font-display); }
    section { display: grid; gap: 1rem; }
    .progress { width: 34%; }
  `,
})
export class Profile {
  protected readonly auth = inject(AuthService);
  private readonly learning = inject(LearningService);
  protected readonly summary = rxResource({ stream: () => this.learning.summary() });
  protected readonly dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

  protected toDate(value: string): Date {
    return new Date(value);
  }
}
