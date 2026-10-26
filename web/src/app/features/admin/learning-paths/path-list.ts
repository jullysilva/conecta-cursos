import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminLearningPath } from '../../../core/models/admin.models';
import { EmptyState } from '../../../shared/components/empty-state';
import { errorMessage } from '../../../shared/utils/http-error';
import { PathDialog, PathDialogResult } from './path-dialog';

@Component({
  selector: 'cp-path-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, PathDialog],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Trilhas</h1>
          <p>Sequências de cursos que o aluno percorre em ordem.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="dialog().open()">
          <i class="ri-add-line" aria-hidden="true"></i> Nova trilha
        </button>
      </header>

      @if (paths.value(); as list) {
        @if (list.length) {
          <div class="panel">
            <table class="table">
              <thead>
                <tr><th scope="col">Trilha</th><th scope="col">Cursos</th><th scope="col">Status</th><th scope="col" class="actions"><span class="sr-only">Ações</span></th></tr>
              </thead>
              <tbody>
                @for (path of list; track path.id) {
                  <tr>
                    <td>
                      <button type="button" class="link" (click)="dialog().open(path)"><strong>{{ path.title }}</strong></button>
                    </td>
                    <td>{{ courseTitles(path) }}</td>
                    <td><span class="badge" [class.is-positive]="path.published">{{ path.published ? 'Publicada' : 'Rascunho' }}</span></td>
                    <td class="actions">
                      <button type="button" class="btn btn-ghost btn-icon" (click)="remove(path)" [attr.aria-label]="'Excluir ' + path.title" title="Excluir">
                        <i class="ri-delete-bin-line" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <cp-empty-state icon="ri-route-line" title="Nenhuma trilha criada" text="Monte uma trilha juntando cursos já existentes." />
        }
      }
    </div>
    <cp-path-dialog [courses]="courses.value() ?? []" (saved)="save($event)" />
  `,
  styles: `
    .link { padding: 0; border: 0; background: none; color: var(--forest); font: inherit; text-align: left; cursor: pointer; }
    .link:hover { text-decoration: underline; }
    td:nth-child(2) { color: var(--ink-soft); max-width: 420px; }
  `,
})
export class PathList {
  private readonly api = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly dialog = viewChild.required(PathDialog);
  protected readonly paths = rxResource({ stream: () => this.api.learningPaths() });
  protected readonly courses = rxResource({ stream: () => this.api.courseOptions() });
  private readonly titleById = computed(
    () => new Map((this.courses.value() ?? []).map((course) => [course.id, course.title])),
  );

  protected courseTitles(path: AdminLearningPath): string {
    if (!path.courseIds.length) return 'Nenhum curso';
    return path.courseIds.map((id) => this.titleById().get(id) ?? '…').join(', ');
  }

  protected save({ id, payload }: PathDialogResult): void {
    const request = id ? this.api.updateLearningPath(id, payload) : this.api.createLearningPath(payload);
    request.subscribe({
      next: () => {
        this.toast.success(id ? 'Trilha salva.' : 'Trilha criada.');
        this.paths.reload();
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }

  protected async remove(path: AdminLearningPath): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir trilha?',
      message: `"${path.title}" será excluída. Os cursos continuam disponíveis.`,
      confirmLabel: 'Excluir trilha',
      danger: true,
    });
    if (!confirmed) return;
    this.api.deleteLearningPath(path.id).subscribe({
      next: () => {
        this.toast.success('Trilha excluída.');
        this.paths.reload();
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
