import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminCourse } from '../../../core/models/admin.models';
import { EmptyState } from '../../../shared/components/empty-state';
import { Pagination } from '../../../shared/components/pagination';
import { errorMessage } from '../../../shared/utils/http-error';
import { debouncedSignal } from '../../../shared/utils/debounced-signal';

const PAGE_SIZE = 20;

@Component({
  selector: 'cp-course-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, Pagination],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Cursos</h1>
          <p>Crie cursos, organize módulos e aulas e publique quando estiverem prontos.</p>
        </div>
        <a routerLink="/adm/cursos/edit/novo" class="btn btn-primary">
          <i class="ri-add-line" aria-hidden="true"></i> Novo curso
        </a>
      </header>

      <div class="toolbar">
        <label class="sr-only" for="course-search">Buscar curso</label>
        <input id="course-search" class="input" type="search" placeholder="Buscar pelo título"
          [value]="search()" (input)="onSearch($any($event.target).value)" />
      </div>

      @if (courses.hasValue() && courses.value(); as result) {
        @if (result.items.length) {
          <div class="panel">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Curso</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Módulos</th>
                  <th scope="col">Alunos</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="actions"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (course of result.items; track course.id) {
                  <tr>
                    <td><a [routerLink]="['/adm/cursos/edit', course.id]"><strong>{{ course.title }}</strong></a></td>
                    <td>{{ course.category?.name ?? '—' }}</td>
                    <td>{{ course._count?.modules }}</td>
                    <td>{{ course._count?.enrollments }}</td>
                    <td>
                      <span class="badge" [class.is-positive]="course.published">{{ course.published ? 'Publicado' : 'Rascunho' }}</span>
                      @if (course.featured) {
                        <span class="badge is-warning">Destaque</span>
                      }
                    </td>
                    <td class="actions">
                      <a class="btn btn-ghost btn-icon" [routerLink]="['/curso', course.id]" [attr.aria-label]="'Ver ' + course.title + ' como aluno'" title="Ver como aluno">
                        <i class="ri-eye-line" aria-hidden="true"></i>
                      </a>
                      <button type="button" class="btn btn-ghost btn-icon" (click)="remove(course)" [attr.aria-label]="'Excluir ' + course.title" title="Excluir">
                        <i class="ri-delete-bin-line" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <cp-pagination [page]="page()" [pageSize]="pageSize" [total]="result.total" (pageChange)="page.set($event)" />
          </div>
        } @else {
          <cp-empty-state icon="ri-book-open-line" [title]="search() ? 'Nenhum curso encontrado' : 'Nenhum curso criado'"
            [text]="search() ? 'Tente buscar por outra palavra.' : 'Crie o primeiro curso para começar a montar o catálogo.'" />
        }
      } @else if (courses.isLoading()) {
        <p class="muted" role="status">Carregando cursos…</p>
      }
    </div>
  `,
})
export class CourseList {
  private readonly api = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly page = signal(1);
  protected readonly search = signal('');
  private readonly debouncedSearch = debouncedSignal(this.search, 300);

  protected readonly courses = rxResource({
    params: () => ({ page: this.page(), pageSize: PAGE_SIZE, search: this.debouncedSearch() }),
    stream: ({ params }) => this.api.courses(params),
  });

  protected onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected async remove(course: AdminCourse): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir curso?',
      message: `"${course.title}" e todas as suas aulas e o progresso dos alunos serão excluídos. Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir curso',
      danger: true,
    });
    if (!confirmed) return;
    this.api.deleteCourse(course.id).subscribe({
      next: () => {
        this.toast.success('Curso excluído.');
        this.courses.reload();
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
