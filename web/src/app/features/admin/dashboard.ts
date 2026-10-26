import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'cp-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Visão geral</h1>
          <p>Números dos últimos 30 dias e do catálogo atual.</p>
        </div>
        <a routerLink="/adm/cursos/edit/novo" class="btn btn-primary">
          <i class="ri-add-line" aria-hidden="true"></i> Novo curso
        </a>
      </header>

      @if (data.value(); as d) {
        <dl class="metrics">
          <div class="lead">
            <dt>Aulas concluídas em 30 dias</dt>
            <dd>{{ d.completionsLast30Days }}</dd>
          </div>
          <div><dt>Alunos ativos em 30 dias</dt><dd>{{ d.activeStudentsLast30Days }}</dd></div>
          <div><dt>Alunos cadastrados</dt><dd>{{ d.students }}</dd></div>
          <div><dt>Cursos publicados</dt><dd>{{ d.publishedCourses }}<small> de {{ d.courses }}</small></dd></div>
          <div><dt>Aulas no catálogo</dt><dd>{{ d.lessons }}</dd></div>
        </dl>

        <section class="panel top" aria-labelledby="top-title">
          <h2 id="top-title">Cursos com mais alunos</h2>
          @if (d.topCourses.length) {
            <ol>
              @for (course of d.topCourses; track course.id) {
                <li>
                  <a [routerLink]="['/adm/cursos/edit', course.id]">{{ course.title }}</a>
                  <span class="bar" aria-hidden="true"><span [style.width.%]="(course.enrollments / maxEnrollments()) * 100"></span></span>
                  <span class="count">{{ course.enrollments }} {{ course.enrollments === 1 ? 'aluno' : 'alunos' }}</span>
                </li>
              }
            </ol>
          } @else {
            <p class="muted">Quando os alunos começarem os cursos, o ranking aparece aqui.</p>
          }
        </section>
      } @else if (data.error()) {
        <p class="muted" role="alert">Não foi possível carregar os números. Recarregue a página.</p>
      } @else {
        <p class="muted" role="status">Carregando…</p>
      }
    </div>
  `,
  styles: `
    .metrics { display: grid; grid-template-columns: 2fr repeat(2, 1fr); gap: 1rem; margin: 0; }
    .metrics div { padding: 1.25rem; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); }
    .metrics .lead { grid-row: span 2; display: flex; flex-direction: column; justify-content: space-between;
      background: var(--ink); border-color: var(--ink); color: #fff; }
    .metrics .lead dd { font-size: 5rem; color: var(--amber); }
    dt { color: inherit; opacity: 0.8; font-weight: 600; }
    dd { margin: 0.375rem 0 0; font: 800 2.25rem/1 var(--font-display); }
    dd small { font-size: 1rem; font-weight: 600; color: var(--ink-faint); }
    .top { display: grid; gap: 1rem; padding: 1.25rem 1.5rem; }
    ol { display: grid; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
    li { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) 6rem; gap: 1rem; align-items: center; }
    li a { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar { height: 8px; border-radius: 999px; background: var(--paper); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: inherit; background: var(--forest); }
    .count { color: var(--ink-soft); text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class Dashboard {
  private readonly api = inject(AdminApiService);
  protected readonly data = rxResource({ stream: () => this.api.dashboard() });
  protected readonly maxEnrollments = computed(() =>
    Math.max(1, ...(this.data.value()?.topCourses.map((course) => course.enrollments) ?? [])),
  );
}
